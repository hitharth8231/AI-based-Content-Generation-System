from main import MIN_CAPTION_WORDS, count_words, ensure_minimum_caption_length


def test_short_platform_captions_are_expanded():
    content = {"LinkedIn": "Great launch!"}

    result = ensure_minimum_caption_length(content, "AI content tools", "Students")

    assert count_words(result["LinkedIn"]) >= MIN_CAPTION_WORDS
    assert "AI content tools" in result["LinkedIn"]


def test_long_platform_captions_are_preserved():
    caption = "This useful caption already has enough words for every platform preview."

    result = ensure_minimum_caption_length({"Instagram": caption}, "AI", "Creators")

    assert result["Instagram"] == caption
