"use client";

import { MultiOnClient } from "multion";
import Image from "next/image";
import { useState } from "react";

const multiOn = new MultiOnClient({
  apiKey: process.env.NEXT_PUBLIC_MULTION_API_KEY || "",
});

console.log(
  "API Key:",
  process.env.NEXT_PUBLIC_MULTION_API_KEY ? "Set" : "Not set"
);
console.log("MultiOn client initialized:", multiOn ? "Yes" : "No");

export default function WorkspaceBuilder() {
  const [inputText, setInputText] = useState("");
  const [submittedText, setSubmittedText] = useState("");
  const [links, setLinks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(event.target.value);
  };

  const handleSubmit = async () => {
    if (!inputText.trim()) {
      console.log("Empty search query, aborting.");
      return;
    }

    setSubmittedText(inputText);
    setInputText("");
    setIsLoading(true);

    console.log(
      "API Key before API call:",
      process.env.NEXT_PUBLIC_MULTION_API_KEY ? "Present" : "Missing"
    );

    try {
      console.log("Creating session...");
      const createResponse = await multiOn.sessions.create({
        url: "https://www.google.com",
      });
      const sessionId = createResponse.sessionId;
      console.log("Session created with ID:", sessionId);

      const searchQuery = inputText;
      console.log("Sending step command for search query:", searchQuery);
      const stepResponse = await multiOn.sessions.step(sessionId, {
        cmd: `Search for "${searchQuery}" and visit the top 5 results to extract their URLs.`,
      });
      console.log("Step response:", stepResponse);

      let extractedLinks: string[] = [];

      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      if (stepResponse.url && stepResponse.url.includes("google.com/search")) {
        for (let i = 0; i < 5; i++) {
          await delay(1000);
          const extractLinkResponse = await multiOn.sessions.step(sessionId, {
            cmd: `Find and return the URL of the ${i + 1}${
              i === 0 ? "st" : i === 1 ? "nd" : i === 2 ? "rd" : "th"
            } relevant website about "${searchQuery}" from the Google search results.`,
          });
          console.log(`Extract link response ${i + 1}:`, extractLinkResponse);

          if (
            extractLinkResponse.url &&
            !extractLinkResponse.url.includes("google.com")
          ) {
            extractedLinks.push(extractLinkResponse.url);
          } else {
            console.log(`Failed to extract URL for result ${i + 1}`);
          }
        }
      }

      console.log("Extracted links:", extractedLinks);
      setLinks(extractedLinks);

      for (const link of extractedLinks) {
        await multiOn.sessions.step(sessionId, {
          cmd: `Open ${link} in a new tab.`,
        });
        console.log(`Opened link in new tab: ${link}`);
      }

      console.log("Closing session...");
      await multiOn.sessions.close(sessionId);
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const shortenUrl = (url: string) => {
    const urlObj = new URL(url);
    return urlObj.hostname + urlObj.pathname.slice(0, 15) + (urlObj.pathname.length > 15 ? '...' : '');
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

      <p className="mt-4 text-xl">You want to build a workspace around what topic?</p>
      <div className="mt-8 w-full max-w-2xl">
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
        {links.length > 0 && (
          <div className="mt-8 w-full">
            <h2 className="text-2xl font-bold mb-4">Relevant Links:</h2>
            <ul className="space-y-2">
              {links.map((link, index) => (
                <li key={index} className="bg-white rounded-lg shadow-md p-4">
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {shortenUrl(link)}
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