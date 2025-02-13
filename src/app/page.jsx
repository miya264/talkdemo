"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaMicrophone, FaVolumeUp, FaFlag, FaChartLine } from "react-icons/fa";

export default function Home() {
    const [sessionId, setSessionId] = useState("");
    const [transcribedText, setTranscribedText] = useState("");
    const [audioUrl, setAudioUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [conversationHistory, setConversationHistory] = useState([]);
    const [recording, setRecording] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        setSessionId(() => Math.random().toString(36).substr(2, 9));
    }, []);

    const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT;

    // 録音の波形アニメーション
    const waveAnimation = {
        scale: recording ? [1, 1.2, 1] : 1,
        opacity: recording ? [0.6, 1, 0.6] : 1,
        transition: { duration: 1, repeat: Infinity },
    };

    // 進捗アニメーション
    const progressAnimation = {
        width: `${progress}%`,
        transition: { duration: 0.5 },
    };

    // 音声録音と文字起こし
    const handleRecord = async () => {
        setLoading(true);
        setRecording(true);
        setStatusMessage("🎤 録音中...");
        try {
            const response = await fetch(`${API_ENDPOINT}/onsei/`, { method: "POST" });
            if (!response.ok) throw new Error("録音に失敗しました");
            const data = await response.json();
            
            if (!data.transcribed_text) throw new Error("音声の文字起こしに失敗しました");
            
            setTranscribedText(data.transcribed_text);
            setConversationHistory(prev => [...prev, { role: "user", content: data.transcribed_text }]);
            setStatusMessage("✅ 録音完了。AIの応答を生成中...");
            setRecording(false);
            await handleGenerateAudio(data.transcribed_text);
        } catch (error) {
            console.error("録音エラー:", error);
            setStatusMessage("⚠️ 録音エラー");
        }
        setLoading(false);
    };

    // 音声でAI応答を取得
    const handleGenerateAudio = async (message) => {
        setLoading(true);
        setStatusMessage("🤖 AIの応答を生成中...");
        try {
            const response = await fetch(`${API_ENDPOINT}/audio/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: sessionId, message }),
            });
            if (!response.ok) throw new Error("音声生成に失敗しました");
            const data = await response.json();
            
            if (!data.text || !data.audio_url) throw new Error("AIの応答が取得できませんでした");
            
            setConversationHistory(prev => [...prev, { role: "assistant", content: data.text }]);
            setAudioUrl(`${API_ENDPOINT}${data.audio_url}`);
            setStatusMessage("✅ AIの応答が生成されました");
            setPlaying(true);
            setProgress(prev => Math.min(prev + 10, 100));
        } catch (error) {
            console.error("音声生成エラー:", error);
            setStatusMessage("⚠️ AIの応答生成に失敗しました");
        }
        setLoading(false);
    };

    return (
        <div className="p-6 max-w-md mx-auto bg-blue-500 text-white rounded-xl shadow-md space-y-4 relative">
            <h1 className="text-xl font-bold text-center">🌕 AIカウンセラー</h1>
            
            {/* 進捗バー */}
            <div className="w-full bg-gray-200 h-2 rounded-lg overflow-hidden">
                <motion.div className="h-2 bg-yellow-400" animate={progressAnimation}></motion.div>
            </div>
            
            <p className="text-center">{statusMessage}</p>
            
            <div className="flex justify-center items-center">
                {recording && <motion.div className="w-8 h-8 bg-red-500 rounded-full" animate={waveAnimation} />}
            </div>
            
            <div className="space-y-2 p-2">
                {conversationHistory.map((msg, index) => (
                    <div key={index} className={`p-3 rounded-lg ${msg.role === "user" ? "bg-blue-600 text-right" : "bg-yellow-500 text-left"}`}>
                        <p className={msg.role === "user" ? "font-bold text-white" : "font-bold text-gray-900 flex items-center"}>
                            {msg.role === "user" ? "あなた:" : <FaVolumeUp className="mr-2 animate-pulse" />} AIカウンセラー:
                        </p>
                        <p>{msg.content}</p>
                    </div>
                ))}
            </div>
            
            <button onClick={handleRecord} className="w-full bg-yellow-400 text-black px-4 py-2 rounded flex items-center justify-center">
                {loading ? "処理中..." : <><FaMicrophone className="mr-2" /> 話す</>}
            </button>
            
            {audioUrl && 
                <audio 
                    src={audioUrl} 
                    controls 
                    autoPlay 
                    className="w-full mt-4"
                    onPlay={() => setPlaying(true)} 
                    onEnded={() => setPlaying(false)}
                />
            }
        </div>
    );
}
