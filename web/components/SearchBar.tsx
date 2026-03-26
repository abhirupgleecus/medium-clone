"use client";

type SearchBarProps = {
  search: string;
  activeTag: string;
  tags: string[];
  onSearchChange: (value: string) => void;
  onTagChange: (tag: string) => void;
};

export default function SearchBar({
  search,
  activeTag,
  tags,
  onSearchChange,
  onTagChange
}: SearchBarProps) {
  return (
    <section className="search-panel">
      <label htmlFor="search-input">Search</label>
      <input
        id="search-input"
        placeholder="Search by title or content"
        type="text"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />

      <div className="tag-filter-wrap">
        <button
          className={activeTag.length === 0 ? "tag-button active" : "tag-button"}
          onClick={() => onTagChange("")}
          type="button"
        >
          All tags
        </button>

        {tags.map((tag) => (
          <button
            className={activeTag === tag ? "tag-button active" : "tag-button"}
            key={tag}
            onClick={() => onTagChange(tag)}
            type="button"
          >
            #{tag}
          </button>
        ))}
      </div>
    </section>
  );
}