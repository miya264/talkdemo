"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaMicrophone } from "react-icons/fa";

export default function Home() {
    const [sessionId, setSessionId] = useState("");
    const [conversationHistory, setConversationHistory] = useState([]);
    const [recording, setRecording] = useState(false);
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioChunks, setAudioChunks] = useState([]);
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        setSessionId(() => Math.random().toString(36).substr(2, 9));
    }, []);

    const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT;

    const handleRecord = async () => {
        if (recording) {
            setRecording(false);
            mediaRecorder.stop();
            return;
        }

        try {
            setStatusMessage("🎤 録音中...");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
            setMediaRecorder(recorder);
            setAudioChunks([]);

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    setAudioChunks((prev) => [...prev, event.data]);
                }
            };

            recorder.onstop = async () => {
                setTimeout(async () => {
                    setStatusMessage("⏳ 音声を処理中...");
                    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
                    await sendAudioToBackend(audioBlob);
                }, 500);
            };

            recorder.start();
            setRecording(true);
        } catch (error) {
            console.error("❌ 録音エラー:", error);
            setStatusMessage("⚠️ 録音エラー");
        }
    };

    const sendAudioToBackend = async (audioBlob) => {
        setLoading(true);
        if (!API_ENDPOINT) {
            console.error("❌ APIエンドポイントが設定されていません");
            return;
        }

        const formData = new FormData();
        formData.append("file", audioBlob, "recorded_audio.webm");

        try {
            console.log("📤 送信URL:", `${API_ENDPOINT}/upload-audio/`);
            console.log("📤 送信データ:", audioBlob);

            const response = await fetch(`${API_ENDPOINT}/upload-audio/`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`音声アップロードに失敗しました: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            if (!data.transcribed_text) throw new Error("文字起こしに失敗しました");

            setConversationHistory((prev) => [...prev, { role: "user", content: data.transcribed_text }]);
            setConversationHistory((prev) => [...prev, { role: "assistant", content: data.ai_response }]);
            playAudio(`${API_ENDPOINT}${data.audio_url}`);
            setStatusMessage("✅ AIの応答が生成されました");
        } catch (error) {
            console.error("送信エラー:", error);
            setStatusMessage(`⚠️ 送信失敗: ${error.message}`);
        }
        setLoading(false);
    };

    const playAudio = (url) => {
        setIsSpeaking(true);
        const audio = new Audio(url);
        audio.play();
        audio.onended = () => setIsSpeaking(false);
    };


    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-blue-200">
            <div className="w-full max-w-lg bg-white shadow-lg rounded-xl p-6 flex flex-col justify-between" style={{ minHeight: "600px" }}>
                <div>
                    <h1 className="text-center text-lg font-bold mb-2">🧠 AIカウンセラー</h1>
                    <p className="text-center text-gray-600">あなたの不調に寄り添い、一緒に考えていきましょう</p>
                    <div className="w-full h-1 bg-gray-200 my-4" />
                    <div className="h-96 overflow-y-auto bg-gray-50 p-4 rounded-lg">
                        {conversationHistory.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <p>マイクボタンを押して、お話しください</p>
                            </div>
                        ) : (
                            conversationHistory.map((msg, index) => (
                                <div key={index} className={`p-3 rounded-lg mb-2 ${msg.role === "user" ? "bg-blue-100 text-right self-end" : "bg-green-100 text-left self-start"}`}>
                                    <p className={msg.role === "user" ? "font-bold text-blue-800" : "font-bold text-green-800"}>
                                        {msg.role === "user" ? "あなた:" : "AIカウンセラー:"}
                                    </p>
                                    <p>{msg.content}</p>
                                    {msg.role === "assistant" && isSpeaking && (
                                        <motion.div 
                                            animate={{ opacity: [0.5, 1, 0.5] }} 
                                            transition={{ repeat: Infinity, duration: 1 }} 
                                            className="w-5 h-5 bg-green-600 rounded-full mx-auto mt-2" 
                                        />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
                <div className="flex justify-center mt-6">
                    <button
                        onClick={handleRecord}
                        className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-full font-medium transition-all ${
                            recording ? "bg-red-100 text-red-600" : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                        disabled={loading}
                    >
                        {recording ? (
                            <>
                                <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 bg-red-600 rounded-full" />
                                停止
                            </>
                        ) : (
                            <>
                                <FaMicrophone className="mr-2" /> 話す
                            </>
                        )}
                    </button>
                </div>
                <p className="text-center text-sm text-gray-500 mt-2">{statusMessage}</p>
            </div>
        </div>
    );
}