import json
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import ChatConversation, ChatMessage, User
from app.schemas import ChatMessageCreate, ChatResponse, ChatConversationOut, ChatMessageOut
from app.core.deps import get_current_user
from app.services.ai_service import generate_health_response

router = APIRouter(prefix="/chat", tags=["AI Health Chatbot"])


@router.post("", response_model=ChatResponse)
async def send_chat_message(
    chat_in: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submits a health-related query to the AI assistant.
    Checks safety guardrails, queries the medical knowledge base (RAG),
    calls LLM or clinical fallback engine, and records conversation history.
    """
    if not chat_in.message.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message cannot be empty")

    # Get or create conversation
    conversation = None
    if chat_in.conversation_id:
        conversation = db.query(ChatConversation).filter(
            ChatConversation.id == chat_in.conversation_id,
            ChatConversation.user_id == current_user.id
        ).first()

    if not conversation:
        title = chat_in.message[:40] + ("..." if len(chat_in.message) > 40 else "")
        conversation = ChatConversation(user_id=current_user.id, title=title)
        db.add(conversation)
        db.flush()

    # Save user message
    user_msg = ChatMessage(
        conversation_id=conversation.id,
        sender="user",
        content=chat_in.message.strip()
    )
    db.add(user_msg)
    db.commit()

    # Generate response
    ai_result = await generate_health_response(chat_in.message)

    # Save assistant message
    assistant_msg = ChatMessage(
        conversation_id=conversation.id,
        sender="assistant",
        content=ai_result["reply"],
        sources=json.dumps(ai_result["sources"])
    )
    db.add(assistant_msg)
    conversation.updated_at = datetime.now(timezone.utc)
    db.commit()

    return {
        "conversation_id": conversation.id,
        "reply": ai_result["reply"],
        "sources": ai_result["sources"],
        "is_emergency": ai_result["is_emergency"],
        "disclaimer": ai_result["disclaimer"]
    }


@router.get("/conversations", response_model=List[dict])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists recent chat consultation sessions for the user."""
    convs = db.query(ChatConversation).filter(
        ChatConversation.user_id == current_user.id
    ).order_by(ChatConversation.updated_at.desc()).all()

    return [
        {
            "id": c.id,
            "title": c.title,
            "created_at": c.created_at.isoformat(),
            "updated_at": c.updated_at.isoformat(),
            "message_count": len(c.messages)
        } for c in convs
    ]


@router.get("/conversations/{conversation_id}", response_model=dict)
def get_conversation_history(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves full message history of a specific conversation."""
    conv = db.query(ChatConversation).filter(
        ChatConversation.id == conversation_id,
        ChatConversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    messages = []
    for m in conv.messages:
        sources = []
        if m.sources:
            try:
                sources = json.loads(m.sources)
            except Exception:
                sources = [m.sources]

        messages.append({
            "id": m.id,
            "sender": m.sender,
            "content": m.content,
            "sources": sources,
            "created_at": m.created_at.isoformat()
        })

    return {
        "id": conv.id,
        "title": conv.title,
        "created_at": conv.created_at.isoformat(),
        "messages": messages
    }


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_200_OK)
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletes a conversation history."""
    conv = db.query(ChatConversation).filter(
        ChatConversation.id == conversation_id,
        ChatConversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    db.delete(conv)
    db.commit()
    return {"message": "Conversation deleted successfully"}
