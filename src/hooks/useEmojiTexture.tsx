import { createElement, useEffect, useMemo, useRef } from "react";
import { Platform } from "react-native";
import { Skia, FontStyle, Paragraph, Group, useTexture } from "@shopify/react-native-skia";

// Emoji font family names to try per platform.
// Order matters — first match wins.
const EMOJI_CANDIDATES = Platform.select({
  ios: ["Apple Color Emoji", "AppleColorEmoji"],
  android: ["Noto Color Emoji", "NotoColorEmoji"],
  default: ["Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji"],
}) ?? [];

const REGISTERED_FAMILY = "EmojiFont";

// Resolve emoji font once per process — system fonts don't change at runtime.
let _cachedProvider: ReturnType<typeof Skia.TypefaceFontProvider.Make> | null | undefined;

function getEmojiFontProvider() {
  if (_cachedProvider !== undefined) return _cachedProvider;
  try {
    const systemFontMgr = Skia.FontMgr.System();
    for (const family of EMOJI_CANDIDATES) {
      const typeface = systemFontMgr.matchFamilyStyle(family, FontStyle.Normal);
      if (typeface) {
        const provider = Skia.TypefaceFontProvider.Make();
        provider.registerFont(typeface, REGISTERED_FAMILY);
        _cachedProvider = provider;
        return provider;
      }
    }
  } catch {
    // Skia version doesn't support this path — fall through
  }
  _cachedProvider = null;
  return null;
}

/**
 * Pre-rasterizes emoji characters into a horizontal sprite atlas texture.
 *
 * Uses a TypefaceFontProvider with the system emoji typeface registered
 * explicitly — more robust than relying on ParagraphBuilder's built-in
 * font-family name resolution across Skia versions.
 *
 * Requires @shopify/react-native-skia >=2.5.0 for color emoji support.
 */
export function useEmojiTexture(emojis: string[], emojiSize: number) {
  const atlasWidth = emojis.length * emojiSize;
  const atlasHeight = emojiSize;
  const fontSize = emojiSize * 0.75;

  const paragraphsRef = useRef<{ dispose(): void }[]>([]);

  const paragraphs = useMemo(() => {
    const provider = getEmojiFontProvider();
    return emojis.map((emoji) => {
      const builder = provider
        ? Skia.ParagraphBuilder.Make({}, provider)
        : Skia.ParagraphBuilder.Make();
      const para = builder
        .pushStyle({
          fontSize,
          fontFamilies: provider ? [REGISTERED_FAMILY] : EMOJI_CANDIDATES,
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
