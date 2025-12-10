"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Minus,
} from "lucide-react";

interface CyberEditorProps {
  content: string;
  onChange: (content: string) => void;
  disabled?: boolean;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  // Helper to determine button style
  const getBtnClass = (isActive: boolean) =>
    `p-2 rounded hover:bg-zinc-800 transition-colors ${
      isActive ? "text-neon bg-neon/10" : "text-zinc-400 hover:text-zinc-200"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-zinc-800 bg-zinc-900/30 rounded-t-xl mb-2">
      {/* TEXT STYLES */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={getBtnClass(editor.isActive("bold"))}
        title="Bold"
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={getBtnClass(editor.isActive("italic"))}
        title="Italic"
      >
        <Italic size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={getBtnClass(editor.isActive("strike"))}
        title="Strikethrough"
      >
        <Strikethrough size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editor.can().chain().focus().toggleCode().run()}
        className={getBtnClass(editor.isActive("code"))}
        title="Code"
      >
        <Code size={16} />
      </button>

      <div className="w-px h-4 bg-zinc-800 mx-2" />

      {/* HEADINGS */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={getBtnClass(editor.isActive("heading", { level: 1 }))}
        title="Heading 1"
      >
        <Heading1 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={getBtnClass(editor.isActive("heading", { level: 2 }))}
        title="Heading 2"
      >
        <Heading2 size={16} />
      </button>

      <div className="w-px h-4 bg-zinc-800 mx-2" />

      {/* LISTS */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={getBtnClass(editor.isActive("bulletList"))}
        title="Bullet List"
      >
        <List size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={getBtnClass(editor.isActive("orderedList"))}
        title="Ordered List"
      >
        <ListOrdered size={16} />
      </button>

      <div className="w-px h-4 bg-zinc-800 mx-2" />

      {/* EXTRAS */}
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={getBtnClass(editor.isActive("blockquote"))}
        title="Quote"
      >
        <Quote size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className={getBtnClass(false)}
        title="Divider"
      >
        <Minus size={16} />
      </button>

      <div className="flex-grow" />

      {/* HISTORY */}
      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="p-2 text-zinc-500 hover:text-zinc-300 disabled:opacity-30"
        title="Undo"
      >
        <Undo size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="p-2 text-zinc-500 hover:text-zinc-300 disabled:opacity-30"
        title="Redo"
      >
        <Redo size={16} />
      </button>
    </div>
  );
};

export default function CyberEditor({
  content,
  onChange,
  disabled,
}: CyberEditorProps) {
  // FIX: Join class names into a single line to prevent DOMTokenList errors
  const editorClasses = [
    "prose prose-invert prose-sm sm:prose-base max-w-none",
    "focus:outline-none min-h-[300px] px-4 pb-4",
    "text-zinc-300 placeholder-zinc-600",
    "selection:bg-neon/30 selection:text-neon",
    "headings:font-bold headings:text-white",
    "strong:text-neon strong:font-bold",
    "blockquote:border-l-2 blockquote:border-neon blockquote:bg-zinc-900/50 blockquote:py-1 blockquote:px-4 blockquote:not-italic",
    "ul:list-disc ol:list-decimal",
    "code:text-neon code:bg-zinc-900 code:px-1 code:rounded code:font-mono code:before:content-[''] code:after:content-['']",
  ].join(" ");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start typing your neural stream...",
      }),
    ],
    content: content,
    editable: !disabled,
    editorProps: {
      attributes: {
        class: editorClasses,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getText());
    },
  });

  // Handle external content updates
  useEffect(() => {
    if (editor && content !== editor.getText()) {
      // Optional: editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full h-full bg-zinc-950/50 rounded-xl border border-zinc-800 flex flex-col focus-within:ring-1 focus-within:ring-neon/50 focus-within:border-neon transition-all">
      <MenuBar editor={editor} />
      <div
        className="flex-grow overflow-y-auto custom-scrollbar"
        onClick={() => editor.chain().focus().run()}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
