"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  CodeSquare,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Send,
  AtSign,
  Paperclip,
  Smile,
} from "lucide-react";
import { EmojiPickerPopover } from "@/components/channel/MessageReactions";
import { MentionPopover, type MentionUser } from "@/components/channel/MentionPopover";
import TurndownService from "turndown";
import { cn } from "@/lib/utils";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

turndown.addRule("strikethrough", {
  filter: ["del", "s"],
  replacement: (content) => `~~${content}~~`,
});

function htmlToMarkdown(html: string): string {
  if (!html || html === "<p></p>") return "";
  return turndown.turndown(html).trim();
}

function markdownToHtml(markdown: string): string {
  if (!markdown) return "";
  let html = markdown
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
      return `<pre><code class="language-${lang}">${code.trimEnd()}</code></pre>`;
    })
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>")
    .replace(/~~(.+?)~~/g, "<del>$1</del>")
    .replace(/^>\s?(.+)$/gm, "<blockquote><p>$1</p></blockquote>")
    .replace(/^[-*]\s+(.+)$/gm, "<li>$1</li>")
    .replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .split("\n\n")
    .map((block) => {
      if (
        block.startsWith("<pre>") ||
        block.startsWith("<blockquote>") ||
        block.startsWith("<li>")
      ) {
        return block;
      }
      return `<p>${block.replace(/\n/g, "<br>")}</p>`;
    })
    .join("");

  html = html.replace(/(<li>.*?<\/li>)+/g, (match) => `<ul>${match}</ul>`);
  return html;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, isActive, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "rounded p-1 transition-colors",
        isActive
          ? "bg-foreground/10 text-foreground"
          : "text-foreground/30 hover:bg-surface-3 hover:text-foreground/60",
        disabled && "cursor-not-allowed opacity-30"
      )}
    >
      {children}
    </button>
  );
}

function ComposerBar({
  editor,
  showActions,
  onTriggerMention,
}: {
  editor: Editor;
  showActions: boolean;
  onTriggerMention: () => void;
}) {
  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      editor.commands.insertContent(emoji);
      editor.commands.focus();
    },
    [editor]
  );

  return (
    <div className="flex items-center gap-0.5">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Bold (⌘B)"
      >
        <Bold className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Italic (⌘I)"
      >
        <Italic className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="Strikethrough (⌘⇧X)"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </ToolbarButton>

      <div className="mx-1 h-4 w-px bg-foreground/10" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        title="Inline code (⌘E)"
      >
        <Code className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive("codeBlock")}
        title="Code block"
      >
        <CodeSquare className="h-3.5 w-3.5" />
      </ToolbarButton>

      <div className="mx-1 h-4 w-px bg-foreground/10" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        title="Bullet list"
      >
        <List className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        title="Numbered list"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolbarButton>

      <div className="mx-1 h-4 w-px bg-foreground/10" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        title="Quote"
      >
        <Quote className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={setLink}
        isActive={editor.isActive("link")}
        title="Link"
      >
        <LinkIcon className="h-3.5 w-3.5" />
      </ToolbarButton>

      {showActions && (
        <>
          <div className="mx-1 h-4 w-px bg-foreground/10" />

          <ToolbarButton
            onClick={onTriggerMention}
            title="Mention (@)"
          >
            <AtSign className="h-3.5 w-3.5" />
          </ToolbarButton>
          <EmojiPickerPopover onSelect={handleEmojiSelect}>
            <button
              type="button"
              className="rounded p-1 text-foreground/30 transition-colors hover:bg-surface-3 hover:text-foreground/60"
              title="Emoji"
            >
              <Smile className="h-3.5 w-3.5" />
            </button>
          </EmojiPickerPopover>
          <ToolbarButton
            onClick={() => {}}
            disabled
            title="File attachments coming soon"
          >
            <Paperclip className="h-3.5 w-3.5" />
          </ToolbarButton>
        </>
      )}
    </div>
  );
}

export interface RichTextComposerHandle {
  focus: () => void;
  clear: () => void;
  isEmpty: () => boolean;
  getMarkdown: () => string;
  insertText: (text: string) => void;
}

interface RichTextComposerProps {
  placeholder?: string;
  onSend?: (markdown: string) => void;
  onTyping?: () => void;
  initialContent?: string;
  showActions?: boolean;
  showToolbar?: boolean;
  isDM?: boolean;
  onEscape?: () => void;
  enterToSave?: boolean;
  onSave?: (markdown: string) => void;
  autoFocus?: boolean;
  className?: string;
}

export const RichTextComposer = forwardRef<RichTextComposerHandle, RichTextComposerProps>(
  function RichTextComposer(
    {
      placeholder = "Write a message...",
      onSend,
      onTyping,
      initialContent,
      showActions = false,
      showToolbar = true,
      onEscape,
      enterToSave,
      onSave,
      autoFocus = false,
      className,
    },
    ref
  ) {
    const onSendRef = useRef(onSend);
    const onSaveRef = useRef(onSave);
    const onEscapeRef = useRef(onEscape);
    const onTypingRef = useRef(onTyping);
    const enterToSaveRef = useRef(enterToSave);
    useEffect(() => {
      onSendRef.current = onSend;
      onSaveRef.current = onSave;
      onEscapeRef.current = onEscape;
      onTypingRef.current = onTyping;
      enterToSaveRef.current = enterToSave;
    });

    // ── Mention state ──────────────────────────────
    const [mentionOpen, setMentionOpen] = useState(false);
    const [mentionQuery, setMentionQuery] = useState("");
    const [mentionPos, setMentionPos] = useState({ top: 0, left: 0 });
    const mentionOpenRef = useRef(false);
    const mentionStartPosRef = useRef<number | null>(null);
    const composerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      mentionOpenRef.current = mentionOpen;
    }, [mentionOpen]);

    const closeMention = useCallback(() => {
      setMentionOpen(false);
      setMentionQuery("");
      mentionStartPosRef.current = null;
    }, []);

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: false,
          horizontalRule: false,
        }),
        Placeholder.configure({ placeholder }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: "text-ping-purple underline cursor-pointer",
          },
        }),
      ],
      content: initialContent ? markdownToHtml(initialContent) : "",
      autofocus: autoFocus,
      editorProps: {
        attributes: {
          class:
            "prose-none min-h-[20px] max-h-32 overflow-y-auto text-sm text-foreground focus:outline-none",
        },
        handleKeyDown: (view, event) => {
          // If mention popover is open, let it handle navigation keys
          if (mentionOpenRef.current) {
            if (["ArrowDown", "ArrowUp", "Enter", "Tab", "Escape"].includes(event.key)) {
              return true; // Block editor handling; popover's window listener handles it
            }
          }

          if (event.key === "Enter" && !event.shiftKey && !event.altKey) {
            const ed = view.state;
            const { $from } = ed.selection;
            const inCodeBlock = $from.parent.type.name === "codeBlock";
            const inListItem = $from.parent.type.name === "listItem" ||
              $from.node(-1)?.type.name === "listItem";
            if (inCodeBlock || inListItem) {
              return false;
            }
            event.preventDefault();
            if (enterToSaveRef.current && onSaveRef.current) {
              const html = view.dom.closest(".ProseMirror")?.innerHTML ?? "";
              const md = htmlToMarkdown(html);
              if (md) onSaveRef.current(md);
            } else if (onSendRef.current) {
              const html = view.dom.closest(".ProseMirror")?.innerHTML ?? "";
              const md = htmlToMarkdown(html);
              if (md) {
                onSendRef.current(md);
                setTimeout(() => {
                  const tr = view.state.tr;
                  tr.delete(0, view.state.doc.content.size);
                  view.dispatch(tr);
                }, 0);
              }
            }
            return true;
          }
          if (event.key === "Escape" && !mentionOpenRef.current && onEscapeRef.current) {
            event.preventDefault();
            onEscapeRef.current();
            return true;
          }
          return false;
        },
      },
      onUpdate: ({ editor: e }) => {
        onTypingRef.current?.();
        setIsEmpty(e.isEmpty);

        // ── Mention detection ──────────────────────
        const { state } = e;
        const { from } = state.selection;
        const textBefore = state.doc.textBetween(
          Math.max(0, from - 50),
          from,
          "\n",
        );

        // Find the last @ that's either at start or preceded by whitespace
        const mentionMatch = textBefore.match(/(^|[\s])@([^\s@]*)$/);

        if (mentionMatch) {
          const query = mentionMatch[2];
          setMentionQuery(query);
          mentionStartPosRef.current = from - query.length - 1; // position of @

          // Calculate popover position
          const coords = e.view.coordsAtPos(from);
          const composerEl = composerRef.current;
          if (composerEl) {
            const rect = composerEl.getBoundingClientRect();
            setMentionPos({
              top: rect.bottom - coords.top + 8,
              left: Math.max(0, coords.left - rect.left),
            });
          }
          setMentionOpen(true);
        } else if (mentionOpenRef.current) {
          closeMention();
        }
      },
    });

    const [isEmpty, setIsEmpty] = useState(true);

    // ── Mention selection handler ──────────────────
    const handleMentionSelect = useCallback(
      (user: MentionUser) => {
        if (!editor || mentionStartPosRef.current === null) return;

        const { state } = editor;
        const from = mentionStartPosRef.current; // @ position
        const to = state.selection.from; // current cursor

        // Delete @query and insert @Name with a trailing space
        editor
          .chain()
          .focus()
          .deleteRange({ from, to })
          .insertContent(`@${user.name} `)
          .run();

        closeMention();
      },
      [editor, closeMention]
    );

    const triggerMention = useCallback(() => {
      if (!editor) return;
      editor.commands.insertContent("@");
      editor.commands.focus();
    }, [editor]);

    useImperativeHandle(ref, () => ({
      focus: () => editor?.commands.focus(),
      clear: () => { editor?.commands.clearContent(true); closeMention(); },
      isEmpty: () => editor?.isEmpty ?? true,
      getMarkdown: () => htmlToMarkdown(editor?.getHTML() ?? ""),
      insertText: (text: string) => editor?.commands.insertContent(text),
    }));

    const handleSendClick = useCallback(() => {
      if (!editor) return;
      const md = htmlToMarkdown(editor.getHTML());
      if (!md) return;
      onSend?.(md);
      editor.commands.clearContent(true);
    }, [editor, onSend]);

    return (
      <div ref={composerRef} className={cn("relative min-w-0 rounded border border-subtle bg-background focus-within:border-foreground/15", className)}>
        {/* Mention popover */}
        <MentionPopover
          query={mentionQuery}
          isOpen={mentionOpen}
          position={mentionPos}
          onSelect={handleMentionSelect}
          onDismiss={closeMention}
        />

        <div className="overflow-hidden px-3 py-2">
          <EditorContent editor={editor} />
        </div>

        {editor && (
          <div className="flex items-center justify-between border-t border-subtle px-1 py-1">
            {showToolbar ? (
              <ComposerBar
                editor={editor}
                showActions={showActions}
                onTriggerMention={triggerMention}
              />
            ) : (
              <div />
            )}

            {onSend && (
              <button
                type="button"
                onClick={handleSendClick}
                disabled={isEmpty}
                className={cn(
                  "rounded p-1 transition-colors",
                  !isEmpty
                    ? "bg-ping-purple text-white hover:bg-ping-purple-hover"
                    : "text-foreground/20"
                )}
                title="Send message"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
);
