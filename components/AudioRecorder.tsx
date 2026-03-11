// components/AudioRecorder.tsx
import React, { useState, useRef } from 'react';

interface AudioRecorderProps {
    onAudioReady: (audio: { base64: string, mimeType: string }) => void;
    hasAudio: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAudioReady, hasAudio }) => {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mimeType = 'audio/webm';
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
            
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64String = reader.result?.toString().split(',')[1];
                    if (base64String) {
                        onAudioReady({ base64: base64String, mimeType });
                    }
                };
                audioChunksRef.current = [];
                 // Stop all tracks to release the microphone
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error starting audio recording:", err);
            alert("Could not start recording. Please ensure microphone permissions are granted.");
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    if (hasAudio) {
        return <div className="text-xs text-green-400 font-semibold flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
            Audio Saved
        </div>
    }

    return (
        <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className={`text-xs font-semibold py-1 px-3 rounded-md transition-colors flex items-center gap-1 ${
                isRecording 
                ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse' 
                : 'bg-gray-600 hover:bg-gray-500 text-white'
            }`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" /><path d="M5.5 4.5a.5.5 0 01.5-.5h8a.5.5 0 01.5.5v6a.5.5 0 01-.5.5h-2.5a.5.5 0 01-.5-.5V9a.5.5 0 00-.5-.5h-2a.5.5 0 00-.5.5v2.5a.5.5 0 01-.5.5H5.5a.5.5 0 01-.5-.5v-6z" /></svg>
            {isRecording ? 'Stop' : 'Record Audio'}
        </button>
    );
};
