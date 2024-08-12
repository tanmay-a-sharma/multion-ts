"use client";

import { MultiOnClient } from "multion";
import Image from "next/image";
import { useState } from "react";

const multiOn = new MultiOnClient({
  apiKey: process.env.NEXT_PUBLIC_MULTION_API_KEY || "",
});

export default function WorkspaceBuilder() {
  const [inputText, setInputText] = useState("");
  const [submittedText, setSubmittedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tabGroupData, setTabGroupData] = useState<{
    title: string;
    urls: string[];
  } | null>(null);
  const [extractedLinks, setExtractedLinks] = useState<
    { subtopic: string; url: string }[]
  >([]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(event.target.value);
  };

  const handleSubmit = async () => {
    if (!inputText.trim()) return;
  
    setSubmittedText(inputText);
    setInputText("");
    setIsLoading(true);
  
    try {
      console.log("Starting retrieve session...");
      const retrieveResponse = await multiOn.retrieve({
        cmd: `Find 5 most relevant and authoritative websites about "${inputText}".`,
        url: "https://www.google.com",
        fields: ["title", "url"],

      });
  
      console.log("Retrieve response:", JSON.stringify(retrieveResponse, null, 2));
  
      const extractedLinks = retrieveResponse.data.map((item, index) => ({
        subtopic: item.title || `Result ${index + 1}`,
        url: item.url as string
      }));
  
      console.log("Extracted links:", extractedLinks);
  
      setExtractedLinks(extractedLinks as { subtopic: string; url: string }[]);

      setTabGroupData({
        title: `@Web ${inputText}`,
        urls: extractedLinks.map(item => item.url),
      });
  
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold">MultiOn Workspace Builder</h1>

      <Image
        src="/images/multion.jpg"
        alt="MultiOn logo"
        width={900}
        height={400}
        className="mt-4"
        priority
      />

      <p className="mt-4 text-xl">
        You want to build a workspace around what topic?
      </p>
      <div className="mt-8">
        <div className="relative">
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Enter your text here"
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-black"
          />
        </div>
        <button
          onClick={handleSubmit}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Submit"}
        </button>
        {submittedText && (
          <p className="mt-2">Submitted text: {submittedText}</p>
        )}
        {extractedLinks.length > 0 && (
          <div className="mt-4">
            <h2 className="text-2xl font-bold">Tab Group Data:</h2>
            <p>Relevant Links:</p>
            <ul className="list-disc pl-5">
              {extractedLinks.map((item, index) => (
                <li key={index}>
                  <strong>{item.subtopic}:</strong>{" "}
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {item.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
