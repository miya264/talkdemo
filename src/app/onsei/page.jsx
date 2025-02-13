"use client"; 
import { useState } from "react";

export default function Home() {
  const [transcribedText, setTranscribedText] = useState("");
  const [generatedText, setGeneratedText] = useState("");  // 🎯 GPT のテキスト
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  // ① 音声を録音し、テキスト化する
  async function handleRecord() {
    setLoading(true);
    const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT;
    try {
        const response = await fetch(`${API_ENDPOINT}/onsei/`, { method: "POST" });
        const data = await response.json();
        setTranscribedText(data.transcribed_text);
    } catch (error) {
        console.error("エラー:", error);
    } finally {
        setLoading(false);
    }
  }

  async function handleGenerateAudio() {
    setLoading(true);
    const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT;
    try {
        console.log("Fetching from:", `${API_ENDPOINT}/audio/`);  

        const response = await fetch(`${API_ENDPOINT}/audio/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: transcribedText }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`音声APIの呼び出しに失敗しました: ${errorText}`);
        }

        const data = await response.json();
        setGeneratedText(data.text);
        
        const audioUrl = `${API_ENDPOINT}/voice/`; // 🎯 /voice/ に統一
        console.log("Audio URL:", audioUrl);  // 🎯 URL が正しいか確認
        setAudioUrl(audioUrl);

    } catch (error) {
        console.error("エラー詳細:", error.message);
    } finally {
        setLoading(false);
    }
}

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-4">✨ ほめほめアプリ ✨</h1>
      <button onClick={handleRecord} className="bg-blue-500 text-white px-4 py-2 rounded mb-2">
        {loading ? "処理中..." : "🎤 今日の頑張ったことを入力"}
      </button>
      {transcribedText && (
        <div>
          <p>今日の頑張ったこと: {transcribedText}</p>
          <button onClick={handleGenerateAudio} className="bg-green-500 text-white px-4 py-2 rounded mt-2 flex justify-center">
            {loading ? "音声生成中..." : "🔊 褒め言葉を聞く"}
          </button>
        </div>
      )}
      {generatedText && <p className="text-lg font-semibold mt-4">褒め言葉: {generatedText}</p>}
      {audioUrl && <audio src={audioUrl} controls autoPlay className="mt-2" />}
    </div>
  );
}
