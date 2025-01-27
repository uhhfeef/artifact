import { type ActionFunctionArgs, json, type MetaFunction } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { useEffect, useRef } from "react";
import { openai, type ChatMessage } from "~/utils/openai.server";
import Split from 'react-split'
import "~/styles/split.css";

export const meta: MetaFunction = () => {
  return [
    { title: "Chat Interface" },
    { name: "description", content: "A ChatGPT-like interface built with Remix" },
  ];
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const message = formData.get("message") as string;
  const previousMessages = JSON.parse(formData.get("previousMessages") as string || "[]") as ChatMessage[];

  if (!message?.trim()) {
    return json({ error: "Message is required" });
  }

  const newMessages: ChatMessage[] = [...previousMessages, { role: "user", content: message }];

  const completion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: "You are Alice, a large language model. Answer as concisely as possible. if user asks for code, always create it inside tags <code></code>" } as ChatMessage,
      ...newMessages
    ],
    model: "gpt-4o-mini",
  });

  const assistantMessage = completion.choices[0]?.message?.content || "Sorry, I couldn't process that.";
  console.log(assistantMessage);

  newMessages.push({ role: "assistant", content: assistantMessage });
  
  return json({ messages: newMessages });
}

export default function Index() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const formRef = useRef<HTMLFormElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isSubmitting = navigation.state === "submitting";
  
  const messages = actionData && 'messages' in actionData ? (actionData as { messages: ChatMessage[] }).messages : [];

  const renderMessageContent = (content: string) => {
    if (content.includes("<code>") && content.includes("</code>")) {
      const codeContent = content.substring(
        content.indexOf("<code>") + 6,
        content.indexOf("</code>")
      );
      // Convert code content to base64 to use as URL parameter
      const base64Code = btoa(encodeURIComponent(codeContent));
      return (
        <iframe
          src={`/code/${base64Code}`}
          className="w-full h-[500px] overflow-hidden border-0 bg-gray-100 rounded font-mono text-black"
          title="Code Preview"
          loading="lazy"
        />
      );
    }
    return <p className="whitespace-pre-wrap">{content}</p>;
  };

  useEffect(() => {
    if (!isSubmitting) {
      formRef.current?.reset();
    }
    // Scroll to bottom when new messages arrive
    chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
  }, [isSubmitting, messages]);

  return (
    <div className="flex h-screen flex-col bg-gray-100">
      <Split
        sizes={[75, 25]}
        minSize={100}
        expandToMin={false}
        gutterSize={10}
        gutterAlign="center"
        snapOffset={30}
        dragInterval={1}
        direction="horizontal"
        cursor="col-resize"
        className="flex flex-grow"
      >
        <div className="flex flex-col flex-1 overflow-hidden">
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-800"
                  }`}
                >
                  {!message.content.includes("<code>") && renderMessageContent(message.content)}
                </div>
              </div>
            ))}
            {isSubmitting && (
              <div className="flex justify-start">
                <div className="bg-white rounded-lg p-4 max-w-[80%]">
                  <p className="text-black">Thinking...</p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t bg-white p-4">
            <Form method="post" ref={formRef}>
              <input
                type="hidden"
                name="previousMessages"
                value={JSON.stringify(messages)}
              />
              <div className="flex gap-4">
                <input
                  type="text"
                  name="message"
                  className="flex-1 rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                  placeholder="Type your message..."
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </Form>
          </div>
        </div>
        <div className="bg-gray-100 h-full overflow-hidden">
          {messages.map((message) => (
            message.content.includes("<code>") &&
            message.content.includes("</code>") && (
              <div className="flex justify-start">
                <div className="bg-white rounded-lg h-full overflow-hidden p-4 max-w-[80%]">
                  {renderMessageContent(message.content)}
                </div>
              </div>
            )
          ))}
        </div>
      </Split>
    </div>
  );
}
