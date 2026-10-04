# Image prompts (checkpoint)

The user generates the images with their own tool. Your job is to write prompts that drop straight into the layout.

## Which slots need images

- The product's own output, if it shows media (generated pages, posts, listings): a hero shot, 3 feature/service shots, and one wide "place" shot.
- Montage: `ad` (16:9 or 4:3), `story` (9:16), `video` (9:16 or 4:5), `chat` (16:9). Reuse product images where they fit.
- Before/after edits need a matching pair. Say "same subject and framing as image N" and suggest using it as a reference image.

## Prompt recipe

`Photorealistic <shot type> of <subject>, <setting>, <light>, <composition note for the layout>. <mood>. No text, no logos, no watermark.`

- Always say **no text, no logos**. Image models garble text. Overlay any labels in HTML instead (for example a product label on a blank jar band).
- State the aspect ratio and what the layout needs ("plain light background on the right side", "subject on the left third").
- Keep people generic and fictional. Never use real brands or faces.
- Give every prompt a target file name (`garage-hero.webp`) and number the list.

## Example (a local garage)

1. `garage-hero.webp` 4:5: "Photorealistic photo of a friendly mechanic in a clean navy uniform with no logos, standing beside a silver hatchback with its hood open in a bright modern garage, warm daylight, shallow depth of field, plain light background on the right. No text, no logos."
2. `service-brakes.webp` 4:3: "Close-up of a shiny brake disc and red caliper on a lifted car, wheel removed, dramatic side light, photorealistic. No text, no logos."

## Receiving the files

Users often drop the files in Downloads with tool-generated names. Match each file by its content and aspect ratio (`ffprobe`), then convert:

```bash
ffmpeg -i "<downloaded>.png" -c:v libwebp -quality 88 assets/images/<slot>.webp
```

Until images arrive, make placeholders so the build and snapshots keep working (any solid-colour WebP at the right aspect ratio).
