"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useArtStudioStore, Tool } from "@/stores/artStudioStore";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Type as TypeIcon,
  Minus,
  Plus,
  Upload,
  RotateCcw,
  Trash2,
  Copy,
  Palette,
  Check,
  X,
  Edit2,
  Eye,
  EyeOff,
  MousePointer,
  ArrowUp,
  ArrowDown,
  Heading,
  List,
  Quote,
  Code,
} from "lucide-react";
import { toast } from "sonner";

const FONT_FAMILIES = [
  { value: "Arial", label: "Arial" },
  { value: "Helvetica", label: "Helvetica" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Georgia", label: "Georgia" },
  { value: "Verdana", label: "Verdana" },
  { value: "Courier New", label: "Courier New" },
  { value: "Trebuchet MS", label: "Trebuchet MS" },
  { value: "Impact", label: "Impact" },
  { value: "Comic Sans MS", label: "Comic Sans MS" },
  { value: "Tahoma", label: "Tahoma" },
  { value: "Lucida Console", label: "Lucida Console" },
  { value: "Palatino", label: "Palatino" },
  { value: "Garamond", label: "Garamond" },
  { value: "Bookman", label: "Bookman" },
  { value: "Monaco", label: "Monaco" },
  { value: "Consolas", label: "Consolas" },
  { value: "Cambria", label: "Cambria" },
];

const FONT_SIZES = [
  8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 48, 56, 64, 72,
  96, 120,
];

const TEXT_TRANSFORMS = [
  { value: "none", label: "Žiadna" },
  { value: "uppercase", label: "VŠETKO VEĽKÉ" },
  { value: "lowercase", label: "všetko malé" },
  { value: "capitalize", label: "Prvé Veľké" },
];

const TEXT_DECORATIONS = [
  { value: "none", label: "Žiadna" },
  { value: "underline", label: "Podčiarknuté" },
  { value: "line-through", label: "Prečiarknuté" },
];

const TEXT_WRAPS = [
  { value: "word", label: "Podľa slov" },
  { value: "char", label: "Podľa znakov" },
  { value: "none", label: "Žiadne" },
];

export const TextOptionsPanel: React.FC = () => {
  const {
    brushSettings,
    setBrushSettings,
    primaryColor,
    setPrimaryColor,
    activeLayerId,
    selectedId,
    setSelectedId,
    activeTool,
    setActiveTool,
    textObjects,
    editingTextId,
    addTextObject,
    updateTextObject,
    deleteTextObject,
    startTextEdit,
    cancelTextEdit,
  } = useArtStudioStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [activeTextId, setActiveTextId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [customFonts, setCustomFonts] = useState<string[]>([]);
  const [selectedTextIndex, setSelectedTextIndex] = useState<number>(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoized safeBrushSettings to prevent unnecessary recalculations
  const safeBrushSettings = useMemo(() => ({
    ...brushSettings,
    lineHeight: brushSettings.lineHeight ?? 1.2,
    letterSpacing: brushSettings.letterSpacing ?? 0,
    fontFamily: brushSettings.fontFamily ?? "Arial",
    fontSize: brushSettings.fontSize ?? 16,
    fontWeight: brushSettings.fontWeight ?? "normal",
    fontStyle: brushSettings.fontStyle ?? "normal",
    textDecoration: brushSettings.textDecoration ?? "none",
    textAlign: brushSettings.textAlign ?? "left",
    textWrap: brushSettings.textWrap ?? "word",
    textPadding: brushSettings.textPadding ?? 4,
    textOpacity: brushSettings.textOpacity ?? 100,
    textShadow: brushSettings.textShadow ?? false,
    textShadowColor: brushSettings.textShadowColor ?? "#00000080",
    textShadowBlur: brushSettings.textShadowBlur ?? 5,
    textShadowOffsetX: brushSettings.textShadowOffsetX ?? 2,
    textShadowOffsetY: brushSettings.textShadowOffsetY ?? 2,
    textOutline: brushSettings.textOutline ?? false,
    textOutlineColor: brushSettings.textOutlineColor ?? "#ffffff",
    textOutlineWidth: brushSettings.textOutlineWidth ?? 1,
    textTransform: brushSettings.textTransform ?? "none",
    textBackground: brushSettings.textBackground ?? false,
    textBackgroundColor: brushSettings.textBackgroundColor ?? "#ffffff",
    textBackgroundOpacity: brushSettings.textBackgroundOpacity ?? 20,
    textEditingMode: brushSettings.textEditingMode ?? "inline",
  }), [brushSettings]);

  // Aktívny text objekt
  const activeText = useMemo(() => 
    textObjects.find((t) => t.id === activeTextId),
    [textObjects, activeTextId]
  );

  // Transform text preview
  const getTransformedText = useCallback((text: string) => {
    switch (safeBrushSettings.textTransform) {
      case "uppercase":
        return text.toUpperCase();
      case "lowercase":
        return text.toLowerCase();
      case "capitalize":
        return text.replace(/\b\w/g, (char) => char.toUpperCase());
      default:
        return text;
    }
  }, [safeBrushSettings.textTransform]);

  // Načítanie textových objektov - FIXED: Odstránené rekurzívne volanie
  useEffect(() => {
    // Nájsť aktívny text podľa selectedId alebo editingTextId
    const activeText = textObjects.find(
      (t) => t.id === selectedId || t.id === editingTextId
    );
    
    if (activeText) {
      setActiveTextId(activeText.id);
      setEditText(activeText.text);
      setIsEditing(activeText.isEditing || false);
      setSelectedTextIndex(textObjects.findIndex(t => t.id === activeText.id));
    } else if (textObjects.length > 0) {
      // Zobraziť prvý text objekt
      const firstText = textObjects[0];
      setActiveTextId(firstText.id);
      setEditText(firstText.text);
      setSelectedTextIndex(0);
    } else {
      setActiveTextId(null);
      setEditText("");
    }
  }, [textObjects, selectedId, editingTextId]);

  // Focus textarea keď začíname editovať
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.select();
      }, 100);
    }
  }, [isEditing]);

  // Navigácia medzi textovými objektmi
  const navigateText = useCallback((direction: 'prev' | 'next') => {
    if (textObjects.length === 0) return;
    
    const currentIndex = textObjects.findIndex(t => t.id === activeTextId);
    let newIndex = currentIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : textObjects.length - 1;
    } else {
      newIndex = currentIndex < textObjects.length - 1 ? currentIndex + 1 : 0;
    }
    
    const text = textObjects[newIndex];
    setActiveTextId(text.id);
    setEditText(text.text);
    setSelectedTextIndex(newIndex);
    setSelectedId(text.id);
    
    // Informovať canvas o výbere
    window.dispatchEvent(
      new CustomEvent("artstudio:select-text", {
        detail: { textId: text.id },
      }),
    );
  }, [textObjects, activeTextId, setSelectedId]);

  // Vytvorenie nového textu
  const createNewText = useCallback(() => {
    if (!activeLayerId) {
      toast.error("Vyberte vrstvu pre text");
      return;
    }

    const newText = {
      id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: "Kliknite pre editáciu textu",
      x: 100,
      y: 100,
      fontFamily: safeBrushSettings.fontFamily,
      fontSize: safeBrushSettings.fontSize,
      fontWeight: safeBrushSettings.fontWeight,
      fontStyle: safeBrushSettings.fontStyle,
      textDecoration: safeBrushSettings.textDecoration,
      textAlign: safeBrushSettings.textAlign as "left" | "center" | "right" | "justify",
      lineHeight: safeBrushSettings.lineHeight,
      letterSpacing: safeBrushSettings.letterSpacing,
      color: primaryColor,
      wrap: safeBrushSettings.textWrap as "word" | "char" | "none",
      padding: safeBrushSettings.textPadding,
      opacity: safeBrushSettings.textOpacity,
      isEditing: safeBrushSettings.textEditingMode === "inline",
      layerId: activeLayerId,
    };

    // Pridať efekty podľa nastavení
    if (safeBrushSettings.textShadow) {
      Object.assign(newText, {
        shadowColor: safeBrushSettings.textShadowColor,
        shadowBlur: safeBrushSettings.textShadowBlur,
        shadowOffsetX: safeBrushSettings.textShadowOffsetX,
        shadowOffsetY: safeBrushSettings.textShadowOffsetY,
      });
    }

    if (safeBrushSettings.textOutline) {
      Object.assign(newText, {
        outlineColor: safeBrushSettings.textOutlineColor,
        outlineWidth: safeBrushSettings.textOutlineWidth,
      });
    }

    if (safeBrushSettings.textBackground) {
      Object.assign(newText, {
        backgroundColor: safeBrushSettings.textBackgroundColor,
        backgroundOpacity: safeBrushSettings.textBackgroundOpacity,
      });
    }

    addTextObject(newText);
    setActiveTextId(newText.id);
    setEditText(newText.text);
    setIsEditing(safeBrushSettings.textEditingMode === "inline");
    setSelectedId(newText.id);

    // Automaticky začať editáciu
    if (safeBrushSettings.textEditingMode === "inline") {
      startTextEdit(newText.id);
    }

    toast.success("Nový text vytvorený");
  }, [activeLayerId, safeBrushSettings, primaryColor, addTextObject, startTextEdit, setSelectedId]);

  // Začatie editácie existujúceho textu
  const startEditing = useCallback((textId: string) => {
    const text = textObjects.find((t) => t.id === textId);
    if (!text) return;

    setActiveTextId(textId);
    setEditText(text.text);
    setIsEditing(true);
    setSelectedId(textId);

    startTextEdit(textId);
    
    toast.info("Editácia textu spustená");
  }, [textObjects, startTextEdit, setSelectedId]);

  // Uloženie editovaného textu
  const saveTextEdit = useCallback(() => {
    if (!activeTextId) return;

    // Aplikovať transformáciu textu
    let transformedText = editText;
    switch (safeBrushSettings.textTransform) {
      case "uppercase":
        transformedText = editText.toUpperCase();
        break;
      case "lowercase":
        transformedText = editText.toLowerCase();
        break;
      case "capitalize":
        transformedText = editText.replace(/\b\w/g, (char) =>
          char.toUpperCase(),
        );
        break;
    }

    // Vytvoriť aktualizácie
    const updates: any = {
      text: transformedText,
      isEditing: false,
      fontFamily: safeBrushSettings.fontFamily,
      fontSize: safeBrushSettings.fontSize,
      fontWeight: safeBrushSettings.fontWeight,
      fontStyle: safeBrushSettings.fontStyle,
      textDecoration: safeBrushSettings.textDecoration,
      textAlign: safeBrushSettings.textAlign,
      lineHeight: safeBrushSettings.lineHeight,
      letterSpacing: safeBrushSettings.letterSpacing,
      color: primaryColor,
      wrap: safeBrushSettings.textWrap,
      padding: safeBrushSettings.textPadding,
      opacity: safeBrushSettings.textOpacity,
    };

    // Pridať efekty, ak sú aktívne
    if (safeBrushSettings.textShadow) {
      updates.shadowColor = safeBrushSettings.textShadowColor;
      updates.shadowBlur = safeBrushSettings.textShadowBlur;
      updates.shadowOffsetX = safeBrushSettings.textShadowOffsetX;
      updates.shadowOffsetY = safeBrushSettings.textShadowOffsetY;
    }

    if (safeBrushSettings.textOutline) {
      updates.outlineColor = safeBrushSettings.textOutlineColor;
      updates.outlineWidth = safeBrushSettings.textOutlineWidth;
    }

    if (safeBrushSettings.textBackground) {
      updates.backgroundColor = safeBrushSettings.textBackgroundColor;
      updates.backgroundOpacity = safeBrushSettings.textBackgroundOpacity;
    }

    updateTextObject(activeTextId, updates);
    setIsEditing(false);
    
    toast.success("Text uložený");
  }, [activeTextId, editText, safeBrushSettings, primaryColor, updateTextObject]);

  // Zrušenie editácie
  const cancelTextEditAction = useCallback(() => {
    if (!activeTextId) return;
    
    setIsEditing(false);
    cancelTextEdit(activeTextId);
    
    // Obnoviť pôvodný text
    const originalText = textObjects.find(t => t.id === activeTextId);
    if (originalText) {
      setEditText(originalText.text);
    }
    
    toast.info("Editácia zrušená");
  }, [activeTextId, cancelTextEdit, textObjects]);

  // Odstránenie textu
  const deleteText = useCallback(() => {
    if (!activeTextId) return;

    if (confirm("Naozaj chcete odstrániť tento text?")) {
      deleteTextObject(activeTextId);
      
      // Nájsť ďalší text pre zobrazenie
      const remainingTexts = textObjects.filter(t => t.id !== activeTextId);
      if (remainingTexts.length > 0) {
        const nextText = remainingTexts[0];
        setActiveTextId(nextText.id);
        setEditText(nextText.text);
        setSelectedId(nextText.id);
      } else {
        setActiveTextId(null);
        setEditText("");
        setSelectedId(null);
      }
      
      toast.success("Text odstránený");
    }
  }, [activeTextId, deleteTextObject, textObjects, setSelectedId]);

  // Duplikovanie textu
  const duplicateText = useCallback(() => {
    if (!activeTextId) return;

    const originalText = textObjects.find((t) => t.id === activeTextId);
    if (!originalText) return;

    const duplicatedText = {
      ...originalText,
      id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: originalText.x + 20,
      y: originalText.y + 20,
      isEditing: false,
    };

    addTextObject(duplicatedText);
    setActiveTextId(duplicatedText.id);
    setEditText(duplicatedText.text);
    setSelectedId(duplicatedText.id);

    toast.success("Text duplikovaný");
  }, [activeTextId, textObjects, addTextObject, setSelectedId]);

  // Aplikovanie aktuálnych nastavení na vybraný text
  const applySettingsToText = useCallback(() => {
    if (!activeTextId) return;

    const updates: any = {
      fontFamily: safeBrushSettings.fontFamily,
      fontSize: safeBrushSettings.fontSize,
      fontWeight: safeBrushSettings.fontWeight,
      fontStyle: safeBrushSettings.fontStyle,
      textDecoration: safeBrushSettings.textDecoration,
      textAlign: safeBrushSettings.textAlign,
      lineHeight: safeBrushSettings.lineHeight,
      letterSpacing: safeBrushSettings.letterSpacing,
      color: primaryColor,
      wrap: safeBrushSettings.textWrap,
      padding: safeBrushSettings.textPadding,
      opacity: safeBrushSettings.textOpacity,
    };

    // Pridať efekty, ak sú aktívne
    if (safeBrushSettings.textShadow) {
      updates.shadowColor = safeBrushSettings.textShadowColor;
      updates.shadowBlur = safeBrushSettings.textShadowBlur;
      updates.shadowOffsetX = safeBrushSettings.textShadowOffsetX;
      updates.shadowOffsetY = safeBrushSettings.textShadowOffsetY;
    }

    if (safeBrushSettings.textOutline) {
      updates.outlineColor = safeBrushSettings.textOutlineColor;
      updates.outlineWidth = safeBrushSettings.textOutlineWidth;
    }

    if (safeBrushSettings.textBackground) {
      updates.backgroundColor = safeBrushSettings.textBackgroundColor;
      updates.backgroundOpacity = safeBrushSettings.textBackgroundOpacity;
    }

    updateTextObject(activeTextId, updates);

    toast.success("Nastavenia aplikované na text");
  }, [activeTextId, safeBrushSettings, primaryColor, updateTextObject]);

  // Aplikovanie nastavení na všetky texty
  const applySettingsToAllTexts = useCallback(() => {
    if (textObjects.length === 0) return;

    if (confirm(`Aplikovať nastavenia na všetkých ${textObjects.length} textov?`)) {
      textObjects.forEach((text) => {
        const updates: any = {
          fontFamily: safeBrushSettings.fontFamily,
          fontSize: safeBrushSettings.fontSize,
          fontWeight: safeBrushSettings.fontWeight,
          fontStyle: safeBrushSettings.fontStyle,
          textDecoration: safeBrushSettings.textDecoration,
          textAlign: safeBrushSettings.textAlign,
          lineHeight: safeBrushSettings.lineHeight,
          letterSpacing: safeBrushSettings.letterSpacing,
          color: primaryColor,
          wrap: safeBrushSettings.textWrap,
          padding: safeBrushSettings.textPadding,
          opacity: safeBrushSettings.textOpacity,
        };

        updateTextObject(text.id, updates);
      });

      toast.success(`Nastavenia aplikované na ${textObjects.length} textov`);
    }
  }, [textObjects, safeBrushSettings, primaryColor, updateTextObject]);

  // Load custom font
  const loadCustomFont = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".ttf,.otf,.woff,.woff2";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const fontName = file.name.replace(/\.[^/.]+$/, "");
        const fontUrl = URL.createObjectURL(file);

        const fontFace = new FontFace(fontName, `url(${fontUrl})`);
        try {
          await fontFace.load();
          document.fonts.add(fontFace);
          setCustomFonts(prev => [...prev, fontName]);
          setBrushSettings({ fontFamily: fontName });
          toast.success(`Font "${fontName}" loaded successfully`);
        } catch (error) {
          toast.error("Failed to load font");
        }
      }
    };
    input.click();
  }, [setBrushSettings]);

  // Import text from file
  const importTextFromFile = useCallback(() => {
    if (!fileInputRef.current) return;
    fileInputRef.current.click();
  }, []);

  const handleFileImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setEditText(content);
      toast.success(`Text importovaný z ${file.name}`);
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // Export text to file
  const exportTextToFile = useCallback(() => {
    if (!editText) {
      toast.error("Žiadny text na export");
      return;
    }

    const blob = new Blob([editText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `text-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Text exportovaný");
  }, [editText]);

  // Reset all text settings
  const resetTextSettings = useCallback(() => {
    if (confirm("Resetovať všetky nastavenia textu?")) {
      setBrushSettings({
        fontFamily: "Arial",
        fontSize: 16,
        fontWeight: "normal",
        fontStyle: "normal",
        textDecoration: "none",
        textAlign: "left",
        lineHeight: 1.2,
        letterSpacing: 0,
        textWrap: "word",
        textPadding: 4,
        textOpacity: 100,
        textShadow: false,
        textShadowColor: "#00000080",
        textShadowBlur: 5,
        textShadowOffsetX: 2,
        textShadowOffsetY: 2,
        textOutline: false,
        textOutlineColor: "#ffffff",
        textOutlineWidth: 1,
        textTransform: "none",
        textBackground: false,
        textBackgroundColor: "#ffffff",
        textBackgroundOpacity: 20,
        textEditingMode: "inline",
      });
      toast.success("Nastavenia textu resetované");
    }
  }, [setBrushSettings]);

  // Format text with sample formatting
  const formatText = useCallback((format: string) => {
    const textarea = textareaRef.current;
    if (!textarea || !isEditing) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editText.substring(start, end);
    let formattedText = "";

    switch (format) {
      case "bold":
        formattedText = `**${selectedText || "tučný text"}**`;
        break;
      case "italic":
        formattedText = `*${selectedText || "kurzíva"}*`;
        break;
      case "underline":
        formattedText = `__${selectedText || "podčiarknuté"}__`;
        break;
      case "strikethrough":
        formattedText = `~~${selectedText || "prečiarknuté"}~~`;
        break;
      case "code":
        formattedText = `\`${selectedText || "kód"}\``;
        break;
      case "heading":
        formattedText = `# ${selectedText || "Nadpis"}`;
        break;
      case "list":
        formattedText = `• ${selectedText || "položka zoznamu"}`;
        break;
      case "quote":
        formattedText = `> ${selectedText || "citát"}`;
        break;
      default:
        return;
    }

    const newText = editText.substring(0, start) + formattedText + editText.substring(end);
    setEditText(newText);

    // Update cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = start + formattedText.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  }, [isEditing, editText]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeTextId) return;
      
      // Ctrl/Cmd + S - save
      if ((e.ctrlKey || e.metaKey) && e.key === "s" && isEditing) {
        e.preventDefault();
        saveTextEdit();
      }
      
      // Ctrl/Cmd + D - duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === "d" && activeTextId) {
        e.preventDefault();
        duplicateText();
      }
      
      // Delete key - delete text
      if (e.key === "Delete" && activeTextId && !isEditing) {
        e.preventDefault();
        deleteText();
      }
      
      // Arrow keys for navigation
      if (e.key === "ArrowLeft" && textObjects.length > 1) {
        e.preventDefault();
        navigateText("prev");
      }
      if (e.key === "ArrowRight" && textObjects.length > 1) {
        e.preventDefault();
        navigateText("next");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTextId, isEditing, saveTextEdit, duplicateText, deleteText, navigateText, textObjects.length]);

  // Automaticky vypnúť editáciu pri prepnutí nástrojov
  useEffect(() => {
    if (activeTool !== "text" && isEditing) {
      saveTextEdit();
    }
  }, [activeTool, isEditing, saveTextEdit]);

  // Zavrieť editáciu pri odchode z panelu
  useEffect(() => {
    return () => {
      if (isEditing) {
        saveTextEdit();
      }
    };
  }, [isEditing, saveTextEdit]);

  return (
    <div className="panel-glass p-4 w-full space-y-4 animate-fade-in max-h-[calc(100vh-200px)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <TypeIcon className="w-4 h-4" />
          Textový editor
        </h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="h-7 w-7 p-0"
            title={showPreview ? "Skryť náhľad" : "Zobraziť náhľad"}
          >
            {showPreview ? (
              <EyeOff className="w-3 h-3" />
            ) : (
              <Eye className="w-3 h-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={createNewText}
            className="h-7 w-7 p-0"
            title="Nový text"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Rýchle akcie */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={createNewText}
          size="sm"
          className="h-8 text-xs"
          variant="default"
        >
          <TypeIcon className="w-3 h-3 mr-1" />
          Nový text
        </Button>
        {activeText && (
          <Button
            onClick={() => startEditing(activeTextId!)}
            size="sm"
            className="h-8 text-xs"
            variant={isEditing ? "default" : "outline"}
            disabled={isEditing}
          >
            <Edit2 className="w-3 h-3 mr-1" />
            {isEditing ? "Edituje sa..." : "Editovať"}
          </Button>
        )}
      </div>

      {/* Zoznam textových objektov */}
      {textObjects.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              Textové objekty ({textObjects.length})
            </Label>
            <div className="flex gap-1">
              {textObjects.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateText('prev')}
                    className="h-6 w-6 p-0"
                    title="Predchádzajúci"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateText('next')}
                    className="h-6 w-6 p-0"
                    title="Ďalší"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={applySettingsToAllTexts}
                className="h-6 text-xs"
              >
                Aplikovať na všetky
              </Button>
            </div>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {textObjects.map((text, index) => (
              <div
                key={text.id}
                className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer hover:bg-accent transition-colors ${activeTextId === text.id ? "bg-accent border border-primary/20" : ""}`}
                onClick={() => {
                  setActiveTextId(text.id);
                  setEditText(text.text);
                  setSelectedId(text.id);
                  setSelectedTextIndex(index);

                  // Označiť text v canvase
                  window.dispatchEvent(
                    new CustomEvent("artstudio:select-text", {
                      detail: { textId: text.id },
                    }),
                  );
                }}
                onDoubleClick={() => startEditing(text.id)}
              >
                <div className="truncate flex-1">
                  <div className="flex items-center gap-2">
                    {text.isEditing && (
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    )}
                    <span className="font-medium" style={{ color: text.color }}>
                      {text.text.length > 20
                        ? text.text.substring(0, 20) + "..."
                        : text.text}
                    </span>
                  </div>
                  <div className="text-muted-foreground text-[10px]">
                    {text.fontSize}px {text.fontFamily} • {text.text.length} zn.
                  </div>
                </div>
                <div className="flex gap-1">
                  {text.isEditing && (
                    <span className="text-[10px] text-green-600 px-1 py-0.5 bg-green-500/10 rounded">EDIT</span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {index + 1}/{textObjects.length}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editácia textu */}
      {isEditing && activeText && (
        <div className="space-y-3 p-3 bg-accent/30 rounded-md border">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Editácia textu</Label>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="default"
                className="h-6 w-6 p-0"
                onClick={saveTextEdit}
                title="Uložiť (Ctrl+S)"
              >
                <Check className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={cancelTextEditAction}
                title="Zrušiť (Esc)"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <Textarea
            ref={textareaRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="min-h-20 text-sm font-mono"
            placeholder="Zadajte text..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                saveTextEdit();
              }
              if (e.key === "Escape") {
                cancelTextEditAction();
              }
            }}
          />

          {/* Rýchle formátovanie */}
          <div className="flex flex-wrap gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-xs"
              onClick={() => formatText("bold")}
              title="Tučné (Ctrl+B)"
            >
              <Bold className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-xs"
              onClick={() => formatText("italic")}
              title="Kurzíva (Ctrl+I)"
            >
              <Italic className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-xs"
              onClick={() => formatText("underline")}
              title="Podčiarknuté (Ctrl+U)"
            >
              <Underline className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-xs"
              onClick={() => formatText("strikethrough")}
              title="Prečiarknuté"
            >
              <Strikethrough className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-xs"
              onClick={() => formatText("code")}
              title="Kód"
            >
              <Code className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-xs"
              onClick={() => formatText("heading")}
              title="Nadpis"
            >
              <Heading className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-xs"
              onClick={() => formatText("list")}
              title="Zoznam"
            >
              <List className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-xs"
              onClick={() => formatText("quote")}
              title="Citát"
            >
              <Quote className="w-3 h-3" />
            </Button>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="space-x-4">
              <span>{editText.length} znakov</span>
              <span>{editText.split(/\s+/).length} slov</span>
              <span>{Math.ceil(editText.length / 80)} riadkov</span>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs"
                onClick={() => navigator.clipboard.writeText(editText)}
                title="Kopírovať text"
              >
                Kopírovať
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs"
                onClick={exportTextToFile}
                title="Exportovať do súboru"
              >
                Export
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Základné nastavenia */}
      <div className="space-y-3">
        <Label className="text-xs font-medium">Základné nastavenia</Label>

        <div className="grid grid-cols-2 gap-3">
          {/* Font Family */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Font</Label>
            <Select
              value={safeBrushSettings.fontFamily}
              onValueChange={(value) => setBrushSettings({ fontFamily: value })}
            >
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue placeholder="Vyberte font" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {FONT_FAMILIES.map((font) => (
                  <SelectItem
                    key={font.value}
                    value={font.value}
                    className="text-xs"
                    style={{ fontFamily: font.value }}
                  >
                    {font.label}
                  </SelectItem>
                ))}
                {customFonts.map((font) => (
                  <SelectItem key={font} value={font} className="text-xs">
                    <span style={{ fontFamily: font }}>{font} (Vlastný)</span>
                  </SelectItem>
                ))}
                <SelectItem
                  value="load-custom"
                  onSelect={loadCustomFont}
                  className="text-xs text-primary"
                >
                  + Načítať vlastný font
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Veľkosť</Label>
            <div className="flex items-center gap-2">
              <Button
                onClick={() =>
                  setBrushSettings({
                    fontSize: Math.max(6, safeBrushSettings.fontSize - 1),
                  })
                }
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Select
                value={safeBrushSettings.fontSize.toString()}
                onValueChange={(value) =>
                  setBrushSettings({
                    fontSize: Math.max(6, Math.min(200, parseInt(value) || 16)),
                  })
                }
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {FONT_SIZES.map((size) => (
                    <SelectItem key={size} value={size.toString()} className="text-xs">
                      {size}px
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() =>
                  setBrushSettings({
                    fontSize: Math.min(200, safeBrushSettings.fontSize + 1),
                  })
                }
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Farba textu */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Farba textu</Label>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded border cursor-pointer relative group"
              style={{ backgroundColor: primaryColor }}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "color";
                input.value = primaryColor;
                input.onchange = (e) => {
                  const color = (e.target as HTMLInputElement).value;
                  setPrimaryColor(color);
                };
                input.click();
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Palette className="w-4 h-4 text-white/80" />
              </div>
            </div>
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-8 text-xs flex-1 font-mono"
              placeholder="#000000"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setPrimaryColor("#000000")}
              title="Čierna"
            >
              <div className="w-4 h-4 rounded bg-black"></div>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setPrimaryColor("#ffffff")}
              title="Biela"
            >
              <div className="w-4 h-4 rounded bg-white border"></div>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setPrimaryColor("#3b82f6")}
              title="Modrá"
            >
              <div className="w-4 h-4 rounded bg-blue-500"></div>
            </Button>
          </div>
        </div>

        {/* Štýl písma */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Štýl písma</Label>
          <div className="flex flex-wrap gap-1">
            <Toggle
              pressed={safeBrushSettings.fontWeight === "bold"}
              onPressedChange={(pressed) =>
                setBrushSettings({ fontWeight: pressed ? "bold" : "normal" })
              }
              className="h-8 px-3"
              aria-label="Tučné"
              title="Tučné (Ctrl+B)"
            >
              <Bold className="w-4 h-4 mr-2" />
              <span className="text-xs">Tučné</span>
            </Toggle>
            <Toggle
              pressed={safeBrushSettings.fontStyle === "italic"}
              onPressedChange={(pressed) =>
                setBrushSettings({ fontStyle: pressed ? "italic" : "normal" })
              }
              className="h-8 px-3"
              aria-label="Kurzíva"
              title="Kurzíva (Ctrl+I)"
            >
              <Italic className="w-4 h-4 mr-2" />
              <span className="text-xs">Kurzíva</span>
            </Toggle>
            <Toggle
              pressed={safeBrushSettings.textDecoration === "underline"}
              onPressedChange={(pressed) =>
                setBrushSettings({
                  textDecoration: pressed ? "underline" : "none",
                })
              }
              className="h-8 px-3"
              aria-label="Podčiarknuté"
              title="Podčiarknuté (Ctrl+U)"
            >
              <Underline className="w-4 h-4 mr-2" />
              <span className="text-xs">Podčiark.</span>
            </Toggle>
            <Toggle
              pressed={safeBrushSettings.textDecoration === "line-through"}
              onPressedChange={(pressed) =>
                setBrushSettings({
                  textDecoration: pressed ? "line-through" : "none",
                })
              }
              className="h-8 px-3"
              aria-label="Prečiarknuté"
              title="Prečiarknuté"
            >
              <Strikethrough className="w-4 h-4 mr-2" />
              <span className="text-xs">Prečiark.</span>
            </Toggle>
          </div>
        </div>

        {/* Text Transform */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Transformácia textu
          </Label>
          <Select
            value={safeBrushSettings.textTransform}
            onValueChange={(value: "none" | "uppercase" | "lowercase" | "capitalize") =>
              setBrushSettings({ textTransform: value })
            }
          >
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue placeholder="Transformácia" />
            </SelectTrigger>
            <SelectContent>
              {TEXT_TRANSFORMS.map((transform) => (
                <SelectItem key={transform.value} value={transform.value} className="text-xs">
                  {transform.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Zarovnanie */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Zarovnanie</Label>
          <div className="flex gap-1">
            <Toggle
              pressed={safeBrushSettings.textAlign === "left"}
              onPressedChange={(pressed) =>
                pressed && setBrushSettings({ textAlign: "left" })
              }
              className="h-8 w-8 p-0"
              aria-label="Vľavo"
              title="Vľavo"
            >
              <AlignLeft className="w-4 h-4" />
            </Toggle>
            <Toggle
              pressed={safeBrushSettings.textAlign === "center"}
              onPressedChange={(pressed) =>
                pressed && setBrushSettings({ textAlign: "center" })
              }
              className="h-8 w-8 p-0"
              aria-label="Na stred"
              title="Na stred"
            >
              <AlignCenter className="w-4 h-4" />
            </Toggle>
            <Toggle
              pressed={safeBrushSettings.textAlign === "right"}
              onPressedChange={(pressed) =>
                pressed && setBrushSettings({ textAlign: "right" })
              }
              className="h-8 w-8 p-0"
              aria-label="Vpravo"
              title="Vpravo"
            >
              <AlignRight className="w-4 h-4" />
            </Toggle>
            <Toggle
              pressed={safeBrushSettings.textAlign === "justify"}
              onPressedChange={(pressed) =>
                pressed && setBrushSettings({ textAlign: "justify" })
              }
              className="h-8 w-8 p-0"
              aria-label="Do bloku"
              title="Do bloku"
            >
              <AlignJustify className="w-4 h-4" />
            </Toggle>
          </div>
        </div>
      </div>

      {/* Pokročilé nastavenia */}
      <div className="space-y-3">
        <Label className="text-xs font-medium">Pokročilé nastavenia</Label>

        {/* Line Height */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs text-muted-foreground">Riadkovanie</Label>
            <span className="text-xs font-mono">
              {safeBrushSettings.lineHeight.toFixed(1)}
            </span>
          </div>
          <Slider
            value={[safeBrushSettings.lineHeight]}
            onValueChange={([value]) => setBrushSettings({ lineHeight: value })}
            min={0.5}
            max={3}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Kompaktné</span>
            <span>Normálne</span>
            <span>Vzdialené</span>
          </div>
        </div>

        {/* Letter Spacing */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs text-muted-foreground">
              Medzery medzi písmenami
            </Label>
            <span className="text-xs font-mono">
              {safeBrushSettings.letterSpacing}px
            </span>
          </div>
          <Slider
            value={[safeBrushSettings.letterSpacing]}
            onValueChange={([value]) =>
              setBrushSettings({ letterSpacing: value })
            }
            min={-5}
            max={20}
            step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Tesné</span>
            <span>Normálne</span>
            <span>Vzdialené</span>
          </div>
        </div>

        {/* Text Wrap */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Zalamovanie textu
          </Label>
          <Select
            value={safeBrushSettings.textWrap}
            onValueChange={(value: "word" | "char" | "none") =>
              setBrushSettings({ textWrap: value })
            }
          >
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue placeholder="Zalamovanie" />
            </SelectTrigger>
            <SelectContent>
              {TEXT_WRAPS.map((wrap) => (
                <SelectItem key={wrap.value} value={wrap.value} className="text-xs">
                  {wrap.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Padding */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs text-muted-foreground">
              Vnútorný odsadenie
            </Label>
            <span className="text-xs font-mono">
              {safeBrushSettings.textPadding}px
            </span>
          </div>
          <Slider
            value={[safeBrushSettings.textPadding]}
            onValueChange={([value]) =>
              setBrushSettings({ textPadding: value })
            }
            min={0}
            max={40}
            step={1}
            className="w-full"
          />
        </div>

        {/* Opacity */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs text-muted-foreground">
              Priehľadnosť
            </Label>
            <span className="text-xs font-mono">
              {safeBrushSettings.textOpacity}%
            </span>
          </div>
          <Slider
            value={[safeBrushSettings.textOpacity]}
            onValueChange={([value]) =>
              setBrushSettings({ textOpacity: value })
            }
            min={10}
            max={100}
            step={5}
            className="w-full"
          />
        </div>
      </div>

      {/* Efekty */}
      <div className="space-y-3">
        <Label className="text-xs font-medium">Efekty</Label>

        {/* Text Shadow */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={safeBrushSettings.textShadow}
                onCheckedChange={(checked) =>
                  setBrushSettings({ textShadow: checked })
                }
              />
              <Label className="text-xs">Tieň</Label>
            </div>
            {safeBrushSettings.textShadow && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "color";
                    input.value = safeBrushSettings.textShadowColor;
                    input.onchange = (e) => {
                      const color = (e.target as HTMLInputElement).value;
                      setBrushSettings({ textShadowColor: color });
                    };
                    input.click();
                  }}
                  title="Farba tieňa"
                >
                  <Palette className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setBrushSettings({ textShadowBlur: 5 })}
                  title="Resetovať rozmazanie"
                >
                  Reset
                </Button>
              </div>
            )}
          </div>
          {safeBrushSettings.textShadow && (
            <div className="pl-6 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Rozmazanie
                  </Label>
                  <Input
                    type="number"
                    value={safeBrushSettings.textShadowBlur}
                    onChange={(e) =>
                      setBrushSettings({
                        textShadowBlur: parseInt(e.target.value) || 5,
                      })
                    }
                    className="h-7 text-xs"
                    min="0"
                    max="50"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Posun X</Label>
                  <Input
                    type="number"
                    value={safeBrushSettings.textShadowOffsetX}
                    onChange={(e) =>
                      setBrushSettings({
                        textShadowOffsetX: parseInt(e.target.value) || 2,
                      })
                    }
                    className="h-7 text-xs"
                    min="-20"
                    max="20"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Posun Y</Label>
                  <Input
                    type="number"
                    value={safeBrushSettings.textShadowOffsetY}
                    onChange={(e) =>
                      setBrushSettings({
                        textShadowOffsetY: parseInt(e.target.value) || 2,
                      })
                    }
                    className="h-7 text-xs"
                    min="-20"
                    max="20"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Text Outline */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={safeBrushSettings.textOutline}
                onCheckedChange={(checked) =>
                  setBrushSettings({ textOutline: checked })
                }
              />
              <Label className="text-xs">Obrys</Label>
            </div>
            {safeBrushSettings.textOutline && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "color";
                    input.value = safeBrushSettings.textOutlineColor;
                    input.onchange = (e) => {
                      const color = (e.target as HTMLInputElement).value;
                      setBrushSettings({ textOutlineColor: color });
                    };
                    input.click();
                  }}
                  title="Farba obrysu"
                >
                  <Palette className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
          {safeBrushSettings.textOutline && (
            <div className="pl-6 space-y-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Šírka obrysu
                </Label>
                <Slider
                  value={[safeBrushSettings.textOutlineWidth]}
                  onValueChange={([value]) =>
                    setBrushSettings({ textOutlineWidth: value })
                  }
                  min={1}
                  max={10}
                  step={0.5}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Text Background */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={safeBrushSettings.textBackground}
                onCheckedChange={(checked) =>
                  setBrushSettings({ textBackground: checked })
                }
              />
              <Label className="text-xs">Pozadie</Label>
            </div>
            {safeBrushSettings.textBackground && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "color";
                    input.value = safeBrushSettings.textBackgroundColor;
                    input.onchange = (e) => {
                      const color = (e.target as HTMLInputElement).value;
                      setBrushSettings({ textBackgroundColor: color });
                    };
                    input.click();
                  }}
                  title="Farba pozadia"
                >
                  <Palette className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
          {safeBrushSettings.textBackground && (
            <div className="pl-6 space-y-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Priehľadnosť pozadia
                </Label>
                <Slider
                  value={[safeBrushSettings.textBackgroundOpacity]}
                  onValueChange={([value]) =>
                    setBrushSettings({ textBackgroundOpacity: value })
                  }
                  min={5}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Náhľad */}
      {showPreview && (
        <div className="pt-3 border-t">
          <div className="flex justify-between items-center mb-2">
            <Label className="text-xs font-medium">Náhľad textu</Label>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={resetTextSettings}
                title="Resetovať všetky nastavenia"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={importTextFromFile}
                title="Importovať text zo súboru"
              >
                <Upload className="w-3 h-3 mr-1" />
                Import
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileImport}
                accept=".txt,.md,.html,.json"
                className="hidden"
              />
            </div>
          </div>
          <div
            ref={previewRef}
            className="min-h-32 p-4 bg-muted/30 rounded-md border border-border/50 flex items-center justify-center relative overflow-auto"
            style={{
              backgroundColor: safeBrushSettings.textBackground
                ? `${safeBrushSettings.textBackgroundColor}${Math.round(
                    safeBrushSettings.textBackgroundOpacity * 2.55,
                  )
                    .toString(16)
                    .padStart(2, "0")}`
                : "transparent",
              minHeight: "120px",
              maxHeight: "200px",
            }}
          >
            <div
              className="text-center transition-all duration-200 p-2"
              style={{
                fontFamily: safeBrushSettings.fontFamily,
                fontSize: `${safeBrushSettings.fontSize}px`,
                fontWeight: safeBrushSettings.fontWeight,
                fontStyle: safeBrushSettings.fontStyle,
                textDecoration: safeBrushSettings.textDecoration,
                textAlign: safeBrushSettings.textAlign as any,
                lineHeight: safeBrushSettings.lineHeight,
                letterSpacing: `${safeBrushSettings.letterSpacing}px`,
                color: primaryColor,
                padding: `${safeBrushSettings.textPadding}px`,
                opacity: `${safeBrushSettings.textOpacity}%`,
                maxWidth: "100%",
                wordWrap:
                  safeBrushSettings.textWrap === "none"
                    ? "normal"
                    : "break-word",
                whiteSpace: safeBrushSettings.textWrap === "none" ? "nowrap" : "normal",
                textShadow: safeBrushSettings.textShadow
                  ? `${safeBrushSettings.textShadowOffsetX}px ${safeBrushSettings.textShadowOffsetY}px ${safeBrushSettings.textShadowBlur}px ${safeBrushSettings.textShadowColor}`
                  : "none",
                WebkitTextStroke: safeBrushSettings.textOutline
                  ? `${safeBrushSettings.textOutlineWidth}px ${safeBrushSettings.textOutlineColor}`
                  : "none",
                paintOrder: safeBrushSettings.textOutline
                  ? "stroke fill"
                  : "normal",
              }}
            >
              {getTransformedText(
                editText || "The quick brown fox jumps over the lazy dog",
              )}
            </div>
            {isEditing && (
              <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full animate-pulse flex items-center gap-1">
                <Edit2 className="w-3 h-3" />
                EDITUJE SA
              </div>
            )}
            {activeText && (
              <div className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                {activeText.fontFamily} • {activeText.fontSize}px
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-2 grid grid-cols-2 gap-2">
            <div>
              <span className="font-medium">Znaky: </span>
              {editText.length}
            </div>
            <div>
              <span className="font-medium">Slová: </span>
              {editText.split(/\s+/).length}
            </div>
          </div>
        </div>
      )}

      {/* Akcie pre vybraný text */}
      {activeText && (
        <div className="pt-3 border-t">
          <Label className="text-xs font-medium mb-2 block">
            Akcie pre vybraný text
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={applySettingsToText}
              size="sm"
              className="h-8 text-xs"
              variant="default"
              title="Aplikovať nastavenia na text"
            >
              <Check className="w-3 h-3 mr-1" />
              Aplikovať
            </Button>
            <Button
              onClick={duplicateText}
              size="sm"
              className="h-8 text-xs"
              variant="outline"
              title="Duplikovať text"
            >
              <Copy className="w-3 h-3 mr-1" />
              Duplikovať
            </Button>
            <Button
              onClick={deleteText}
              size="sm"
              className="h-8 text-xs"
              variant="destructive"
              title="Odstrániť text"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Odstrániť
            </Button>
            <Button
              onClick={() => {
                // Prepnúť na nástroj na výber
                setActiveTool("select");
                window.dispatchEvent(
                  new CustomEvent("artstudio:select-text", {
                    detail: { textId: activeTextId },
                  }),
                );
              }}
              size="sm"
              className="h-8 text-xs"
              variant="outline"
              title="Vybrať text v canvase"
            >
              <MousePointer className="w-3 h-3 mr-1" />
              Vybrať
            </Button>
          </div>
        </div>
      )}

      {/* Klávesové skratky */}
      <div className="pt-3 border-t">
        <Label className="text-xs font-medium mb-2 block">Klávesové skratky</Label>
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="grid grid-cols-2 gap-1">
            <div>Ctrl+S: Uložiť text</div>
            <div>Ctrl+D: Duplikovať</div>
            <div>Delete: Odstrániť</div>
            <div>←/→: Navigácia textami</div>
            <div>Ctrl+Enter: Dokončiť editáciu</div>
            <div>Esc: Zrušiť editáciu</div>
          </div>
        </div>
      </div>

      {/* Štatistiky */}
      {textObjects.length > 0 && (
        <div className="pt-3 border-t">
          <Label className="text-xs font-medium mb-2 block">Štatistiky</Label>
          <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <div>Celkový počet textov: {textObjects.length}</div>
              <div>Aktívne editácie: {textObjects.filter(t => t.isEditing).length}</div>
              <div>Celkové znaky: {textObjects.reduce((acc, t) => acc + t.text.length, 0)}</div>
            </div>
            <div className="space-y-1">
              <div>Vrstva: {activeText?.layerId || "N/A"}</div>
              <div>Pozícia: {activeText ? `${Math.round(activeText.x)}, ${Math.round(activeText.y)}` : "N/A"}</div>
              <div>Aktuálny: {selectedTextIndex + 1}/{textObjects.length}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};