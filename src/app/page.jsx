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

    useEffect(() => {
        setSessionId(() => Math.random().toString(36).substr(2, 9));
    }, []);

    const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT;

    const handleRecord = async () => {
        setLoading(true);
        setRecording(true);
        setStatusMessage("🎤 録音中...");
        try {
            const response = await fetch(`${API_ENDPOINT}/onsei/`, { method: "POST" });
            if (!response.ok) throw new Error("録音に失敗しました");
            const data = await response.json();
            if (!data.transcribed_text) throw new Error("音声の文字起こしに失敗しました");

            setConversationHistory(prev => [...prev, { role: "user", content: data.transcribed_text }]);
            setStatusMessage("✅ 録音完了。AIの応答を生成中...");
            setRecording(false);
            await handleGenerateResponse(data.transcribed_text);
        } catch (error) {
            console.error("録音エラー:", error);
            setStatusMessage("⚠️ 録音エラー");
        }
        setLoading(false);
    };

    const handleGenerateResponse = async (message) => {
        setLoading(true);
        setStatusMessage("🤖 AIの応答を生成中...");
        try {
            const response = await fetch(`${API_ENDPOINT}/response/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: sessionId, message }),
            });
            if (!response.ok) throw new Error("AI応答生成に失敗しました");
            const data = await response.json();
            if (!data.text) throw new Error("AIの応答が取得できませんでした");

            setConversationHistory(prev => [...prev, { role: "assistant", content: data.text }]);
            setStatusMessage("✅ AIの応答が生成されました");
        } catch (error) {
            console.error("AI応答エラー:", error);
            setStatusMessage("⚠️ AIの応答生成に失敗しました");
        }
        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-blue-200">
            <div className="w-full max-w-lg bg-white shadow-lg rounded-xl p-6 flex flex-col justify-between" style={{ minHeight: '600px' }}>
                <div>
                    <h1 className="text-center text-lg font-bold mb-2">🧠 AIカウンセラー</h1>
                    <p className="text-center text-gray-600">あなたの不調に寄り添い、一緒に考えていきましょう</p>
                    <div className="w-full h-1 bg-gray-200 my-4" />
                    <div className="h-96 overflow-y-auto bg-gray-50 p-4 rounded-lg flex flex-col justify-center items-center">
                        <div className="text-center text-gray-400">
                            <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12.01L3 12a9 9 0 0118 0z"></path></svg>
                            <p>マイクボタンを押して、お話しください</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-center mt-6">
                    <button
                        onClick={handleRecord}
                        className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-full font-medium transition-all ${recording ? 'bg-red-100 text-red-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                        disabled={loading}
                    >
                        {recording ? (
                            <>
                                <motion.div 
                                    animate={{ opacity: [0.5, 1, 0.5] }} 
                                    transition={{ repeat: Infinity, duration: 1 }} 
                                    className="w-5 h-5 bg-red-600 rounded-full" />
                                処理中...
                            </>
                        ) : (
                            <><FaMicrophone className="mr-2" /> 話す</>
                        )}
                    </button>
                </div>
                <p className="text-center text-sm text-gray-500 mt-2">{statusMessage}</p>
            </div>
        </div>
    );
}
