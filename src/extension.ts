import * as vscode from "vscode";
import Ollama from "ollama";

export function activate(context: vscode.ExtensionContext) {
  console.log("Deep Chat extension activated!");
  const disposable = vscode.commands.registerCommand("deep-chat-ext", () => {
    console.log("Deep Chat command triggered!");
    const panel = vscode.window.createWebviewPanel(
      "deepchat",
      "Deep Seek Chat",
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = getWebviewContent();

    panel.webview.onDidReceiveMessage(async (message: any) => {
      if (message.command === "chat") {
        const userPrompt = message.text;
        let responseText = "";
        try {
          const streamResponse = await Ollama.chat({
            model: "deepseek-r1:1.5b",
            messages: [{ role: "user", content: userPrompt }],
            stream: true,
          });

          console.log("Stream Response:", streamResponse);

          for await (const part of streamResponse) {
            responseText += part.message.content;
            panel.webview.postMessage({
              command: "chatResponse",
              text: responseText,
            });
          }
        } catch (error) {
          console.error("Error in chat request:", error);
          panel.webview.postMessage({
            command: "chatResponse",
            text: `Error: ${String(error)}`,
          });
        }
      }
    });
  });

  context.subscriptions.push(disposable);
}

function getWebviewContent(): string {
  return /*html*/ `
	<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background-color: #1e1e1e;
        color: #dcdcdc;
      }

      .container {
        display: flex;
        flex-direction: column;
        background-color: #2d2d2d;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        height: 90%;
        width: 90%;
        max-width: 800px;
        min-width: 400px;
      }

      h2 {
        text-align: center;
        color: #61dafb;
        font-size: 1.8rem;
        margin-bottom: 1rem;
      }

      #prompt {
        width: 100%;
        padding: 12px;
        border-radius: 6px;
        border: 1px solid #444;
        background-color: #333;
        color: #dcdcdc;
        font-size: 1.1rem;
        resize: none;
        min-height: 80px;
        flex-shrink: 0;
      }

      #askBtn {
        margin-top: 0.7rem;
        width: 100%;
        padding: 12px;
        font-size: 1.2rem;
        background-color: #61dafb;
        color: #1e1e1e;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: background-color 0.3s ease;
        flex-shrink: 0;
      }

      #askBtn:hover {
        background-color: #4fa3e0;
      }

      #response {
        flex-grow: 1;
        overflow-y: auto;
        margin-top: 1.5rem;
        padding: 15px;
        background-color: #333;
        border-radius: 6px;
        border: 1px solid #444;
        min-height: 50px;
        color: #bdbdbd;
        white-space: pre-wrap;
        word-wrap: break-word;
        font-size: 1.1rem;
      }

      .loading {
        color: #888;
        font-style: sans-serif;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>DEEP SEEK VSCODE EXTENSION</h2>
      <textarea
        id="prompt"
        rows="4"
        placeholder="Enter your question here"
      ></textarea>
      <button id="askBtn">Ask</button>
      <div id="response" class="loading">Awaiting your question...</div>
    </div>

    <script>
      const vscode = acquireVsCodeApi();

      function sendMessage() {
        const text = document.getElementById("prompt").value;
        if (text.trim()) {
          document.getElementById("response").innerText = "Thinking...";
          vscode.postMessage({ command: "chat", text });
        } else {
          document.getElementById("response").innerText = "Please enter a question.";
        }
      }

      document.getElementById('askBtn').addEventListener("click", sendMessage);

      document.getElementById('prompt').addEventListener("keydown", (event) => {
        if (event.key === "Enter" && event.shiftKey) {
          event.preventDefault();
          sendMessage();
        }
      });

      window.addEventListener("message", event => {
        const { command, text } = event.data;
        if (command === "chatResponse") {
          document.getElementById("response").innerText = text;
        }
      });
    </script>
  </body>
</html>
`;
}

export function deactivate() {}
