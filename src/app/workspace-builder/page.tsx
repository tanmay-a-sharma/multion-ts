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

      console.log("Sending step command...");
      const stepResponse = await multiOn.sessions.step(sessionId, {
        cmd: `Find relevant links for building a workspace related to: ${submittedText}. Please return a list of URLs, each on a new line.`,
      });
      console.log("Step response:", stepResponse);

      // Extract links from the response
      const extractedLinks = stepResponse.message
        .split("\n")
        .filter((line) => line.trim().startsWith("http"));
      console.log("Extracted links:", extractedLinks);
      setLinks(extractedLinks);

      // If no links were found, try to extract from the URL
      if (extractedLinks.length === 0 && stepResponse.url) {
        console.log(
          "No links found in message, extracting from URL:",
          stepResponse.url
        );
        setLinks([stepResponse.url]);
      }

      console.log("Closing session...");
      await multiOn.sessions.close(sessionId);
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      // Add more detailed error logging
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
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
      />

      <p className="mt-4 text-xl">What do you want to build?</p>
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
        {links.length > 0 && (
          <div className="mt-4">
            <h2 className="text-2xl font-bold">Relevant Links:</h2>
            <ul className="list-disc pl-5">
              {links.map((link, index) => (
                <li key={index}>
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {link}
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
