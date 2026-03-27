import bleach

ALLOWED_TAGS = [
    "p", "b", "i", "u", "strong", "em",
    "h1", "h2", "h3", "h4",
    "ul", "ol", "li",
    "a", "blockquote", "code",
    "img"
]

ALLOWED_ATTRIBUTES = {
    "a": ["href", "title"],
    "img": ["src", "alt"],
}

def sanitize_html(content: str) -> str:
    return bleach.clean(
        content,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        strip=True,
    )