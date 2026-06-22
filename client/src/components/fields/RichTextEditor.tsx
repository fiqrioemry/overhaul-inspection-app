// src/components/fields/RichTextEditor.tsx
import { forwardRef, useImperativeHandle, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { cn } from "@/lib/utils";

export interface RichTextEditorHandle {
  /** Replace the whole document with the given HTML. */
  setContent: (html: string) => void;
  /** Append HTML (e.g. AI output) to the end of the current document. */
  appendContent: (html: string) => void;
  getHTML: () => string;
  isEmpty: () => boolean;
  focus: () => void;
}

interface RichTextEditorProps {
  /** Initial HTML content (applied once on mount / when editor becomes ready). */
  initialContent?: string;
  placeholder?: string;
  onChange?: (html: string) => void;
  className?: string;
}

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;
  const btn = (active: boolean) =>
    cn("px-2 py-1 rounded text-xs", active ? "bg-primary text-primary-foreground" : "hover:bg-muted");
  return (
    <div className="flex flex-wrap gap-1 border-b px-3 py-2 bg-muted/30">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={cn(btn(editor.isActive("bold")), "font-bold")}>B</button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={cn(btn(editor.isActive("italic")), "italic")}>I</button>
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive("bulletList"))} title="Bullet list">• List</button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive("orderedList"))} title="Numbered list">1. List</button>
      <button type="button" onClick={() => editor.chain().focus().setParagraph().run()} className={btn(editor.isActive("paragraph") && !editor.isActive("heading"))}>¶ Normal</button>
    </div>
  );
}

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(function RichTextEditor(
  { initialContent = "", placeholder, onChange, className },
  ref,
) {
  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: placeholder ?? "Tulis di sini..." })],
    content: initialContent,
    editorProps: {
      attributes: { class: "min-h-32 px-3 py-2 text-sm focus:outline-none prose prose-sm dark:prose-invert max-w-none" },
    },
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  });

  // Apply initialContent once the editor instance is ready (it is null on first render).
  useEffect(() => {
    if (editor && initialContent && editor.isEmpty) {
      editor.commands.setContent(initialContent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  useImperativeHandle(
    ref,
    () => ({
      setContent: (html: string) => {
        editor?.commands.setContent(html);
        onChange?.(editor?.getHTML() ?? html);
      },
      appendContent: (html: string) => {
        if (!editor) return;
        editor.chain().focus("end").insertContent(html).run();
        onChange?.(editor.getHTML());
      },
      getHTML: () => editor?.getHTML() ?? "",
      isEmpty: () => editor?.isEmpty ?? true,
      focus: () => editor?.commands.focus(),
    }),
    [editor, onChange],
  );

  return (
    <div className={cn("rounded-md border overflow-hidden", className)}>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
});

export default RichTextEditor;
