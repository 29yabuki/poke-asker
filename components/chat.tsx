'use client'

import { Input } from './input'
import { Button } from './button'
import Image from 'next/image'
import { useChat } from 'ai/react'
import { useRef, useEffect } from 'react'

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();
  const chatParent = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const domNode = chatParent.current
    if (domNode) {
      domNode.scrollTop = domNode.scrollHeight
    }
  }, [messages])

  return (
    <main className="flex flex-col w-full h-screen max-h-dvh bg-background">
      <header className="p-4 border-b w-full max-w-3xl mx-auto flex items-center">
        <h1 className="text-2xl font-bold text-primary ml-4">PokéAsker</h1>
      </header>

      <section className="p-4">
        <form onSubmit={handleSubmit} className="flex w-full max-w-3xl mx-auto items-center">
          <Input className="flex-1 min-h-[40px]" placeholder="Your Pokémon question is..." type="text" value={input} onChange={handleInputChange} />
          <Button className="ml-2" type="submit">
            Submit
          </Button>
        </form>
      </section>

      <section className="container px-0 pb-10 flex flex-col flex-grow gap-4 mx-auto max-w-3xl">
        <ul ref={chatParent} className="h-1 p-4 flex-grow bg-muted/50 rounded-lg overflow-y-auto flex flex-col gap-4">
          {messages.map((m, index) => (
            <li key={index} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-xl p-4 bg-background shadow-md flex ${m.role === 'user' ? 'bg-blue-200' : 'bg-gray-200'}`}>
                <p className="text-black">
                  {typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

    </main>
  )
}