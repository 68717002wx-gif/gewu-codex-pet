# Visual Review

## Summary
- Overall: ISSUE
- Reviewed images: 1

## Per-page findings
| Page | Source image | Status | Findings | Suggested fix |
| --- | --- | --- | --- | --- |
| 1 | `gewu-codex-pet/assets/sprites/source-grid-large.png` | ISSUE | The image is a full source/contact sheet with red coordinate grid, labels, dimension lines, color/spec text, and background. It is useful for locating sprites but not suitable as a final standalone desktop-pet asset. Some right-side info text is also close to/cut by the edge. | Crop individual pet views/expressions from a clean non-grid source if available, remove labels/dimension marks/background, and export transparent PNG sprites. Use the recommended crop boxes below as guides. |

## Recommended crop boxes

Format: `name x1,y1,x2,y2`

### Full-body / angle sprites
- `front_full_body 120,70,455,445`
- `side_full_body 584,70,816,445`
- `back_full_body 918,74,1245,445`
- `45_left_front 45,565,225,766`
- `45_right_front 242,558,419,766`
- `45_left_back 532,570,720,770`
- `45_right_back 779,570,954,770`
- `top_view 996,608,1204,758`
- `bottom_view 1274,603,1492,756`

### Expression / bust sprites
- `expression_smile 40,870,177,980`
- `expression_happy 204,870,371,980`
- `expression_focus 395,870,565,980`
- `expression_surprised 590,870,761,980`
- `expression_thinking 782,870,944,980`
- `expression_cheer 970,870,1128,980`

## Best default Demo desktop-pet asset

- Recommended default: `front_full_body 120,70,455,445`
- Reason: it is the clearest single full-body mascot, front-facing, expressive, centered, and immediately recognizable as the main desktop pet.
