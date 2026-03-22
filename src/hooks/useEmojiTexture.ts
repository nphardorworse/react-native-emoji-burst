import { createElement, useEffect, useMemo, useRef } from "react";
import { Platform } from "react-native";
import { Skia, Paragraph, Group, useTexture } from "@shopify/react-native-skia";

const EMOJI_FONT_FAMILY = Platform.select({
  ios: "Apple Color Emoji",
  default: "Noto Color Emoji",
});

/**
 * Pre-rasterizes emoji characters into a horizontal sprite atlas texture.
 * Uses the Paragraph API for proper emoji font fallback.
 */
export function useEmojiTexture(emojis: string[], emojiSize: number) {
  const atlasWidth = emojis.length * emojiSize;
  const atlasHeight = emojiSize;
  const fontSize = emojiSize * 0.75;

  const paragraphsRef = useRef<{ dispose(): void }[]>([]);

  const paragraphs = useMemo(() => {
    return emojis.map((emoji) => {
      const para = Skia.ParagraphBuilder.Make()
        .pushStyle({
          fontSize,
          fontFamilies: [EMOJI_FONT_FAMILY, "System"],
        })
        .addText(emoji)
        .pop()
        .build();
      para.layout(emojiSize);
      return para;
    });
  }, [emojis, emojiSize, fontSize]);

  // Keep ref in sync for unmount cleanup.
  // Do NOT dispose old paragraphs here — useTexture's drawAsPicture is
  // async and a pending draw from a prior render may still reference them.
  // Old paragraphs will be GC'd once no async operation references them.
  paragraphsRef.current = paragraphs;

  // Dispose current paragraphs on unmount only
  useEffect(() => {
    return () => {
      paragraphsRef.current.forEach((p) => p.dispose());
    };
  }, []);

  const element = useMemo(() => {
    const elements = paragraphs.map((para, index) =>
      createElement(Paragraph, {
        key: index,
        paragraph: para,
        x: index * emojiSize,
        y: emojiSize * 0.1,
        width: emojiSize,
      })
    );
    return createElement(Group, null, ...elements);
  }, [paragraphs, emojiSize]);

  // deps must be explicit — useTexture defaults to [] which only draws once on mount
  const texture = useTexture(
    element,
    { width: atlasWidth, height: atlasHeight },
    [element, atlasWidth, atlasHeight]
  );

  return { texture, emojiCount: emojis.length };
}
