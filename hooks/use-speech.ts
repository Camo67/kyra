'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type SpeechRecognitionConstructor = new () => {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

type SpeechRecognitionEventLike = {
  results: ArrayLike<{
    isFinal: boolean
    0: {
      transcript: string
    }
  }>
}

type SpeechRecognitionErrorLike = {
  error?: string
}

const getSpeechRecognitionConstructor = () => {
  if (typeof window === 'undefined') return undefined
  return (
    (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition
  )
}

export function useVoiceInput(onTranscript: (text: string) => void) {
  const [isSupported, setIsSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<InstanceType<SpeechRecognitionConstructor> | null>(null)
  const callbackRef = useRef(onTranscript)

  useEffect(() => {
    callbackRef.current = onTranscript
  }, [onTranscript])

  useEffect(() => {
    const RecognitionCtor = getSpeechRecognitionConstructor()
    if (!RecognitionCtor) {
      setIsSupported(false)
      return
    }
    setIsSupported(true)
    const recognition = new RecognitionCtor()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.continuous = false
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript)
        .join(' ')
        .trim()
      if (transcript) {
        callbackRef.current(transcript)
      }
    }
    recognition.onerror = (event) => {
      if (event?.error === 'not-allowed') {
        setError('Microphone permission denied. Check your browser settings.')
      } else {
        setError('Voice capture failed. Please try again.')
      }
      setIsListening(false)
    }
    recognition.onstart = () => {
      setError(null)
      setIsListening(true)
    }
    recognition.onend = () => {
      setIsListening(false)
    }
    recognitionRef.current = recognition

    return () => {
      recognition.stop()
      recognitionRef.current = null
    }
  }, [])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return
    setError(null)
    try {
      recognitionRef.current.start()
    } catch {
      // Start can throw if called while already running, so fall back to stopping first.
      recognitionRef.current.stop()
      recognitionRef.current.start()
    }
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  return {
    isSupported,
    isListening,
    error,
    startListening,
    stopListening,
  }
}

export function useTextToSpeech() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const queueRef = useRef<SpeechSynthesisUtterance | null>(null)
  const [voiceName, setVoiceName] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis
      setIsSupported(true)
      const loadVoices = () => {
        const available = window.speechSynthesis.getVoices()
        setVoices(available)
        if (!voiceRef.current && available.length > 0) {
          voiceRef.current =
            available.find((voice) => voice.lang.toLowerCase().startsWith('en')) ||
            available[0]
          setVoiceName(voiceRef.current?.name ?? null)
        }
      }

      loadVoices()
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
      return () => {
        synthRef.current?.cancel()
        window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
      }
    }
  }, [])

  const speak = useCallback((text: string, voice?: SpeechSynthesisVoice | string) => {
    if (!synthRef.current || !text?.trim()) {
      setError('TTS not available in this browser.')
      return
    }
    setError(null)
    synthRef.current.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const targetVoice =
      typeof voice === 'string'
        ? voices.find((v) => v.name === voice) || voiceRef.current
        : voice || voiceRef.current
    if (targetVoice) {
      utterance.voice = targetVoice
      setVoiceName(targetVoice.name)
    }
    queueRef.current = utterance
    utterance.onend = () => {
      setIsSpeaking(false)
      queueRef.current = null
    }
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error)
      setIsSpeaking(false)
      setError('Unable to play audio. Check system output.')
      queueRef.current = null
    }
    setIsSpeaking(true)
    synthRef.current.speak(utterance)
  }, [voices])

  const stop = useCallback(() => {
    if (!synthRef.current) return
    synthRef.current.cancel()
    setIsSpeaking(false)
    queueRef.current = null
  }, [])

  const setVoice = useCallback((voiceId: string) => {
    const found = voices.find((voice) => voice.name === voiceId)
    if (!found) return
    voiceRef.current = found
    setVoiceName(found.name)
    if (queueRef.current) {
      speak(queueRef.current.text, found)
    }
  }, [])

  return {
    isSupported,
    isSpeaking,
    error,
    voices,
    voiceName,
    speak,
    stop,
    setVoice,
  }
}
