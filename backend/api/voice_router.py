"""
Voice API Router
Provides endpoints for speech-to-text and text-to-speech
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional
from services.voice_service import get_voice_service
from services.logger import get_logger

router = APIRouter(prefix="/voice", tags=["voice"])
logger = get_logger("voice-api")


class TextToSpeechRequest(BaseModel):
    """Text-to-speech request model"""
    text: str
    voice: str = "default"


class VoiceCommandRequest(BaseModel):
    """Voice command request model"""
    command: str


@router.post("/speech-to-text")
async def speech_to_text(audio: UploadFile = File(...)):
    """
    Convert speech to text
    Accepts audio file upload
    """
    try:
        voice_service = get_voice_service()

        # Read audio data
        audio_data = await audio.read()

        # Convert to text
        text = voice_service.speech_to_text(audio_data)

        if text is None:
            raise HTTPException(status_code=503, detail="Speech recognition service unavailable")

        return {
            "success": True,
            "text": text,
            "confidence": 0.95  # Placeholder
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to convert speech to text: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/text-to-speech")
async def text_to_speech(request: TextToSpeechRequest):
    """
    Convert text to speech
    Returns audio data or URL
    """
    try:
        voice_service = get_voice_service()

        # Convert to speech
        audio_data = voice_service.text_to_speech(request.text, request.voice)

        if audio_data is None:
            raise HTTPException(status_code=503, detail="Text-to-speech service unavailable")

        # In a real implementation, this would return audio data or a URL
        # For now, return a placeholder
        return {
            "success": True,
            "message": "Audio generated (placeholder)",
            "audio_url": "/audio/placeholder.mp3",
            "duration": len(request.text) * 0.1  # Rough estimate
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to convert text to speech: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/voices")
async def list_voices():
    """List available TTS voices"""
    try:
        voice_service = get_voice_service()
        voices = voice_service.list_voices()

        return {
            "success": True,
            "voices": voices,
            "count": len(voices)
        }
    except Exception as e:
        logger.error(f"Failed to list voices: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/enable-wake-word")
async def enable_wake_word(wake_word: str = "hey clippy"):
    """Enable wake word detection"""
    try:
        voice_service = get_voice_service()
        voice_service.enable_wake_word(wake_word)

        return {
            "success": True,
            "message": f"Wake word enabled: {wake_word}",
            "wake_word": wake_word
        }
    except Exception as e:
        logger.error(f"Failed to enable wake word: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/command")
async def process_voice_command(request: VoiceCommandRequest):
    """Process a voice command"""
    try:
        voice_service = get_voice_service()
        result = voice_service.process_voice_command(request.command)

        return {
            "success": True,
            **result
        }
    except Exception as e:
        logger.error(f"Failed to process voice command: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_voice_status():
    """Get voice service status"""
    try:
        voice_service = get_voice_service()

        return {
            "success": True,
            "stt_enabled": voice_service.stt_enabled,
            "tts_enabled": voice_service.tts_enabled,
            "available_voices": len(voice_service.list_voices())
        }
    except Exception as e:
        logger.error(f"Failed to get voice status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
