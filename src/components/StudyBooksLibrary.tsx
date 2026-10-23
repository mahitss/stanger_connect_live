import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Bookmark,
  ChevronRight,
  Layers,
  Sparkles,
  FileText,
  Play,
} from 'lucide-react';
import {
  StudyBookItem,
  StudyBookCategory,
  STUDY_BOOK_CATEGORIES,
  BookStudyProgressRecord,
  filterStudyBooks,
  validateAndCreateCustomStudyBook,
  formatStudyTimerHMS,
  formatStudyDurationLabel,
} from '../utils/rules';

interface StudyBooksLibraryProps {
  books: StudyBookItem[];
  activeBookId: string;
  onSelectActiveBook: (book: StudyBookItem, applyRecommendedDuration?: boolean) => void;
  onAddCustomBook: (book: StudyBookItem) => void;
  bookProgressMap: Record<string, BookStudyProgressRecord>;
  onUpdateBookProgress: (params: {
    book: StudyBookItem;
    currentPage?: number;
    toggleChapterNumber?: number;
    verifiedSecondsToAdd?: number;
    personalNotes?: string;
  }) => void;
  isTimerRunning: boolean;
  currentSessionElapsedSeconds: number;
  onStartTimerWithBook: (book: StudyBookItem, customMinutes?: number) => void;
}

export const StudyBooksLibrary: React.FC<StudyBooksLibraryProps> = ({
  books,
  activeBookId,
  onSelectActiveBook,
  onAddCustomBook,
  bookProgressMap,
  onUpdateBookProgress,
  isTimerRunning,
  currentSessionElapsedSeconds,
  onStartTimerWithBook,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | StudyBookCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [showAddBookForm, setShowAddBookForm] = useState(false);

  // Add Custom Book Form State
  const [customTitle, setCustomTitle] = useState('');
  const [customAuthor, setCustomAuthor] = useState('');
  const [customCategory, setCustomCategory] = useState<StudyBookCategory>('Computer Science');
  const [customPages, setCustomPages] = useState('320');
  const [customHours, setCustomHours] = useState('2');
  const [customMinutes, setCustomMinutes] = useState('0');
  const [customSummary, setCustomSummary] = useState('');
  const [customChapterTitle, setCustomChapterTitle] = useState('');
  const [customChapterNotes, setCustomChapterNotes] = useState('');
  const [customBookError, setCustomBookError] = useState('');

  const filteredBooks = useMemo(
    () =>
      filterStudyBooks({
        books,
        category: selectedCategory,
        searchQuery,
      }),
    [books, selectedCategory, searchQuery]
  );

  const activeBook: StudyBookItem = useMemo(() => {
    return books.find((b) => b.id === activeBookId) || books[0];
  }, [books, activeBookId]);

  const activeBookProgress: BookStudyProgressRecord = useMemo(() => {
    return (
      bookProgressMap[activeBook.id] || {
        bookId: activeBook.id,
        currentPage: 1,
        completedChapterNumbers: [],
        verifiedSecondsStudied: 0,
        personalNotes: '',
        lastStudiedAtMs: 0,
      }
    );
  }, [bookProgressMap, activeBook.id]);

  const safeChapterIdx = Math.min(
    Math.max(0, activeChapterIndex),
    Math.max(0, activeBook.chapters.length - 1)
  );
  const activeChapter = activeBook.chapters[safeChapterIdx] || activeBook.chapters[0];

  const totalVerifiedLibrarySeconds = useMemo(() => {
    const storedSum = (Object.values(bookProgressMap) as BookStudyProgressRecord[]).reduce(
      (sum, rec) => sum + (Number(rec.verifiedSecondsStudied) || 0),
      0
    );
    return storedSum + currentSessionElapsedSeconds;
  }, [bookProgressMap, currentSessionElapsedSeconds]);

  const activeBookLiveSeconds =
    activeBookProgress.verifiedSecondsStudied + currentSessionElapsedSeconds;

  const activeBookCompletionPct = useMemo(() => {
    const pagePct = Math.round(
      (activeBookProgress.currentPage / Math.max(1, activeBook.totalPages)) * 100
    );
    const chPct =
      activeBook.chapters.length > 0
        ? Math.round(
            (activeBookProgress.completedChapterNumbers.length /
              activeBook.chapters.length) *
              100
          )
        : 0;
    return Math.min(100, Math.max(pagePct, chPct));
  }, [activeBook, activeBookProgress]);

  const handleCreateCustomBook = (e: React.FormEvent) => {
    e.preventDefault();
    const recMins =
      Math.max(0, Math.floor(Number(customHours) || 0)) * 60 +
      Math.max(0, Math.floor(Number(customMinutes) || 0));
    const res = validateAndCreateCustomStudyBook({
      title: customTitle,
      author: customAuthor,
      category: customCategory,
      totalPages: customPages,
      recommendedMinutes: recMins > 0 ? recMins : 120,
      summary: customSummary,
      firstChapterTitle: customChapterTitle,
      firstChapterNotes: customChapterNotes,
    });
    if (!res.valid || !res.book) {
      setCustomBookError(res.error);
      return;
    }
    setCustomBookError('');
    onAddCustomBook(res.book);
    onSelectActiveBook(res.book, true);
    setActiveChapterIndex(0);
    setCustomTitle('');
    setCustomAuthor('');
    setCustomSummary('');
    setCustomChapterTitle('');
    setCustomChapterNotes('');
    setShowAddBookForm(false);
  };

  return (
    <div
      className="p-6 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-6"
      data-testid="study-books-library-section"
      aria-label="Study Books and Academic Reading Sanctuary"
    >
      {/* Top Header & Verified Book Reading Metrics */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
            <h2 className="text-lg font-bold text-white" data-testid="study-books-heading">
              Study Books & Interactive Reading Library ({books.length} Volumes)
            </h2>
            <span aria-hidden="true" className="text-xs text-zinc-600">
              ·
            </span>
            <span
              className="text-xs font-mono tabular-nums text-emerald-400"
              data-testid="study-books-total-verified-time"
            >
              Verified Book Study Time: {formatStudyTimerHMS(totalVerifiedLibrarySeconds, true)}
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Select any foundational textbook or add your own book, read structured chapters & formulas, track page progress, and record real timer-verified study hours.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddBookForm((prev) => !prev)}
            data-testid="study-toggle-add-book-btn"
            className="px-3.5 py-2 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-md inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>{showAddBookForm ? 'Close Custom Book Form' : 'Add Your Own Study Book'}</span>
          </button>
        </div>
      </div>

      {/* Add Custom Book Form */}
      {showAddBookForm && (
        <form
          onSubmit={handleCreateCustomBook}
          data-testid="study-add-custom-book-form"
          className="p-5 rounded-md bg-[#050505] border border-zinc-800 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
            <h3 className="text-sm font-bold text-white">
              Add a Custom Book to Your Study Mode Sanctuary
            </h3>
            <span className="text-xs font-mono text-emerald-400">
              Real-Timer Bound Volume
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="space-y-1">
              <label htmlFor="custom-book-title" className="block text-xs font-medium text-zinc-300">
                Book Title
              </label>
              <input
                id="custom-book-title"
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g., Operating Systems: Three Easy Pieces"
                data-testid="custom-book-title-input"
                className="w-full px-3 py-2 text-xs bg-[#0A0A0C] border border-zinc-800 rounded text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="custom-book-author" className="block text-xs font-medium text-zinc-300">
                Author(s)
              </label>
              <input
                id="custom-book-author"
                type="text"
                value={customAuthor}
                onChange={(e) => setCustomAuthor(e.target.value)}
                placeholder="e.g., Remzi Arpaci-Dusseau"
                data-testid="custom-book-author-input"
                className="w-full px-3 py-2 text-xs bg-[#0A0A0C] border border-zinc-800 rounded text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="custom-book-category" className="block text-xs font-medium text-zinc-300">
                Discipline Category
              </label>
              <select
                id="custom-book-category"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value as StudyBookCategory)}
                data-testid="custom-book-category-select"
                className="w-full px-3 py-2 text-xs bg-[#0A0A0C] border border-zinc-800 rounded text-white focus:outline-none focus:border-zinc-500"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Systems Design">Systems Design</option>
                <option value="Math & Physics">Math & Physics</option>
                <option value="Deep Work & Focus">Deep Work & Focus</option>
                <option value="Philosophy">Philosophy</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label htmlFor="custom-book-pages" className="block text-xs font-medium text-zinc-300">
                  Pages
                </label>
                <input
                  id="custom-book-pages"
                  type="number"
                  min={10}
                  max={3000}
                  value={customPages}
                  onChange={(e) => setCustomPages(e.target.value)}
                  data-testid="custom-book-pages-input"
                  className="w-full px-2.5 py-2 text-xs font-mono bg-[#0A0A0C] border border-zinc-800 rounded text-white"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="custom-book-hours" className="block text-xs font-medium text-zinc-300">
                  Target Hrs
                </label>
                <input
                  id="custom-book-hours"
                  type="number"
                  min={0}
                  max={12}
                  value={customHours}
                  onChange={(e) => setCustomHours(e.target.value)}
                  data-testid="custom-book-hours-input"
                  className="w-full px-2.5 py-2 text-xs font-mono bg-[#0A0A0C] border border-zinc-800 rounded text-white"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="custom-book-mins" className="block text-xs font-medium text-zinc-300">
                  Target Mins
                </label>
                <input
                  id="custom-book-mins"
                  type="number"
                  min={0}
                  max={59}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  data-testid="custom-book-mins-input"
                  className="w-full px-2.5 py-2 text-xs font-mono bg-[#0A0A0C] border border-zinc-800 rounded text-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label htmlFor="custom-book-ch-title" className="block text-xs font-medium text-zinc-300">
                First Chapter / Study Module Title
              </label>
              <input
                id="custom-book-ch-title"
                type="text"
                value={customChapterTitle}
                onChange={(e) => setCustomChapterTitle(e.target.value)}
                placeholder="e.g., Chapter 1: CPU Virtualization & Process APIs"
                className="w-full px-3 py-2 text-xs bg-[#0A0A0C] border border-zinc-800 rounded text-white placeholder:text-zinc-600"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="custom-book-summary" className="block text-xs font-medium text-zinc-300">
                Book Summary / Study Goal
              </label>
              <input
                id="custom-book-summary"
                type="text"
                value={customSummary}
                onChange={(e) => setCustomSummary(e.target.value)}
                placeholder="Core focus and study objective for this book..."
                className="w-full px-3 py-2 text-xs bg-[#0A0A0C] border border-zinc-800 rounded text-white placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="custom-book-notes" className="block text-xs font-medium text-zinc-300">
              Chapter Study Text / Key Concepts & Formulas
            </label>
            <textarea
              id="custom-book-notes"
              rows={2}
              value={customChapterNotes}
              onChange={(e) => setCustomChapterNotes(e.target.value)}
              placeholder="Paste or write key theorems, chapter notes, or study material to read while your timer runs..."
              className="w-full px-3 py-2 text-xs bg-[#0A0A0C] border border-zinc-800 rounded text-white placeholder:text-zinc-600"
            />
          </div>

          {customBookError && (
            <p className="text-xs text-rose-400" data-testid="custom-book-error">
              {customBookError}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddBookForm(false)}
              className="px-3.5 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="custom-book-submit-btn"
              className="px-4 py-2 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-md"
            >
              Save Book & Load into Study Reader
            </button>
          </div>
        </form>
      )}

      {/* Category Filter Bar & Search Input */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Filter study books by discipline"
        >
          {STUDY_BOOK_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                data-testid={`study-book-category-${cat.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-white text-black border-white'
                    : 'bg-[#050505] text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-600'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[240px] flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search books, authors, or concepts..."
            aria-label="Search study books"
            data-testid="study-books-search-input"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#050505] border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
          />
        </div>
      </div>

      {/* Main 12-Column Books Grid + Interactive Book Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 Columns: Book Catalog List */}
        <div
          className="lg:col-span-5 space-y-2.5 max-h-[680px] overflow-y-auto pr-1"
          data-testid="study-books-catalog-list"
        >
          {filteredBooks.length === 0 ? (
            <div className="p-5 rounded-md bg-[#050505] border border-zinc-800/80 text-xs text-zinc-400 space-y-2">
              <p>No study books match your current filter or search query.</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-zinc-900 text-white rounded border border-zinc-800"
              >
                Reset Book Filters
              </button>
            </div>
          ) : (
            filteredBooks.map((book) => {
              const isSelected = book.id === activeBook.id;
              const prog = bookProgressMap[book.id];
              const bookVerifiedSecs =
                (prog?.verifiedSecondsStudied || 0) +
                (isSelected ? currentSessionElapsedSeconds : 0);
              const pageDone = prog?.currentPage || 1;

              return (
                <div
                  key={book.id}
                  data-testid={`study-book-card-${book.id}`}
                  onClick={() => {
                    onSelectActiveBook(book, false);
                    setActiveChapterIndex(0);
                  }}
                  className={`p-4 rounded-md border transition-colors cursor-pointer space-y-2.5 ${
                    isSelected
                      ? 'bg-[#111318] border-emerald-500/60'
                      : 'bg-[#050505] border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: book.coverAccentHex }}
                        />
                        <span className="text-[11px] font-mono text-zinc-400">
                          {book.category} · {book.difficulty}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white leading-snug">
                        {book.title}
                      </h3>
                      <div className="text-xs text-zinc-400">{book.author}</div>
                    </div>

                    {isSelected && (
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded shrink-0">
                        Active Book
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {book.summary}
                  </p>

                  <div className="pt-2 border-t border-zinc-900 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono tabular-nums">
                    <span className="text-zinc-400">
                      p.{pageDone}/{book.totalPages} · Rec: {book.recommendedDurationLabel}
                    </span>
                    <span className="text-emerald-400 font-semibold">
                      Studied: {formatStudyTimerHMS(bookVerifiedSecs, true)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectActiveBook(book, true);
                        setActiveChapterIndex(0);
                      }}
                      data-testid={`study-select-book-btn-${book.id}`}
                      className="flex-1 py-1.5 px-2.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-800 rounded whitespace-nowrap"
                    >
                      Load Book & Target ({formatStudyDurationLabel(book.recommendedMinutes).split(' (')[0]})
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartTimerWithBook(book, book.recommendedMinutes);
                        setActiveChapterIndex(0);
                      }}
                      data-testid={`study-start-with-book-btn-${book.id}`}
                      className="py-1.5 px-3 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Study Now</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right 7 Columns: Interactive Book Reader, Chapter Synthesis & Verified Progress */}
        <div
          className="lg:col-span-7 p-5 rounded-md bg-[#050505] border border-zinc-800/80 space-y-5"
          data-testid="study-active-book-reader"
        >
          {/* Active Book Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800/80 pb-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-zinc-400">
                <span className="text-emerald-400 font-semibold">{activeBook.category}</span>
                <span>·</span>
                <span>{activeBook.difficulty}</span>
                <span>·</span>
                <span>{activeBook.totalPages} Pages</span>
              </div>
              <h3
                className="text-lg font-bold text-white"
                data-testid="study-reader-book-title"
              >
                {activeBook.title}
              </h3>
              <p className="text-xs text-zinc-400">
                By <strong className="text-zinc-200">{activeBook.author}</strong> · Recommended Study Block:{' '}
                <span className="font-mono text-white">{activeBook.recommendedDurationLabel}</span>
              </p>
            </div>

            <div className="p-3 rounded-md bg-[#0A0A0C] border border-zinc-800 text-right space-y-0.5 shrink-0">
              <div className="text-[11px] font-mono text-zinc-400">
                Real Timer Verified on Book
              </div>
              <div
                className="text-base font-bold font-mono tabular-nums text-emerald-400"
                data-testid="study-reader-verified-time"
              >
                {formatStudyTimerHMS(activeBookLiveSeconds, true)}
              </div>
              <div className="text-[10px] font-mono text-zinc-500">
                {isTimerRunning
                  ? 'Recording live from active timer'
                  : 'Start timer to record reading time'}
              </div>
            </div>
          </div>

          {/* Page Progress & Chapter Completion Strip */}
          <div className="p-4 rounded-md bg-[#0A0A0C] border border-zinc-800/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <label
                  htmlFor="book-current-page-input"
                  className="text-xs font-semibold text-zinc-200"
                >
                  Current Page Bookmark:
                </label>
                <input
                  id="book-current-page-input"
                  type="number"
                  min={1}
                  max={activeBook.totalPages}
                  value={activeBookProgress.currentPage}
                  onChange={(e) =>
                    onUpdateBookProgress({
                      book: activeBook,
                      currentPage: Number(e.target.value),
                    })
                  }
                  data-testid="study-book-page-input"
                  className="w-20 px-2.5 py-1 text-xs font-mono tabular-nums bg-[#050505] border border-zinc-800 rounded text-white"
                />
                <span className="text-xs font-mono text-zinc-400">
                  / {activeBook.totalPages} pages ({activeBookCompletionPct}%)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateBookProgress({
                      book: activeBook,
                      currentPage: Math.min(
                        activeBook.totalPages,
                        activeBookProgress.currentPage + 10
                      ),
                    })
                  }
                  data-testid="study-book-advance-10p-btn"
                  className="px-2.5 py-1 text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded"
                >
                  +10 Pages Read
                </button>
              </div>
            </div>

            <div className="w-full h-2 bg-[#050505] border border-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-150"
                style={{ width: `${activeBookCompletionPct}%` }}
              />
            </div>
          </div>

          {/* Chapter Selector Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Structured Study Chapters ({activeBook.chapters.length})
              </span>
              <span className="text-xs font-mono text-zinc-500">
                {activeBookProgress.completedChapterNumbers.length} / {activeBook.chapters.length} Chapters Mastered
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {activeBook.chapters.map((ch, idx) => {
                const isCurr = idx === safeChapterIdx;
                const isDone = activeBookProgress.completedChapterNumbers.includes(
                  ch.chapterNumber
                );
                return (
                  <button
                    key={ch.chapterNumber}
                    type="button"
                    onClick={() => setActiveChapterIndex(idx)}
                    data-testid={`study-book-chapter-tab-${ch.chapterNumber}`}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md border flex items-center gap-1.5 transition-colors ${
                      isCurr
                        ? 'bg-white text-black border-white'
                        : 'bg-[#0A0A0C] text-zinc-300 border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    {isDone && (
                      <CheckCircle2
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isCurr ? 'text-emerald-600' : 'text-emerald-400'
                        }`}
                      />
                    )}
                    <span>
                      Ch. {ch.chapterNumber}: {ch.title.slice(0, 28)}
                      {ch.title.length > 28 ? '…' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Chapter Deep Reading Content */}
          {activeChapter && (
            <div
              className="p-4 rounded-md bg-[#0A0A0C] border border-zinc-800 space-y-4"
              data-testid="study-book-chapter-content"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-zinc-800/80 pb-3">
                <div>
                  <div className="text-xs font-mono text-emerald-400">
                    Chapter {activeChapter.chapterNumber} · {activeChapter.pageRange}
                  </div>
                  <h4 className="text-base font-bold text-white mt-0.5">
                    {activeChapter.title}
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onUpdateBookProgress({
                      book: activeBook,
                      toggleChapterNumber: activeChapter.chapterNumber,
                    })
                  }
                  data-testid="study-book-toggle-chapter-complete-btn"
                  className={`px-3 py-1.5 text-xs font-semibold rounded border flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    activeBookProgress.completedChapterNumbers.includes(
                      activeChapter.chapterNumber
                    )
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {activeBookProgress.completedChapterNumbers.includes(
                      activeChapter.chapterNumber
                    )
                      ? 'Chapter Mastered'
                      : 'Mark Chapter Studied'}
                  </span>
                </button>
              </div>

              {/* Core Concepts */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  <span>Core Concepts in This Chapter:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeChapter.coreConcepts.map((concept) => (
                    <span
                      key={concept}
                      className="px-2.5 py-1 text-xs font-mono bg-[#050505] border border-zinc-800 text-zinc-200 rounded"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>

              {/* Detailed Study Text */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Chapter Synthesis & Reading Material:</span>
                </div>
                <p className="text-xs text-zinc-200 leading-relaxed bg-[#050505] p-3.5 rounded border border-zinc-800/80">
                  {activeChapter.detailedStudyText}
                </p>
              </div>

              {/* Formula / Formal Invariant Box */}
              <div className="p-3 rounded bg-[#050505] border border-zinc-800 space-y-1">
                <div className="text-[11px] font-mono uppercase text-amber-400">
                  Key Formula / Mental Model Invariant
                </div>
                <div className="text-xs font-mono text-white">
                  {activeChapter.keyFormulaOrModel}
                </div>
              </div>

              {/* Active Recall Prompt */}
              <div className="p-3 rounded bg-[#050505] border border-zinc-800 space-y-1">
                <div className="text-[11px] font-mono uppercase text-sky-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Feynman Active Recall Check</span>
                </div>
                <p className="text-xs text-zinc-300">{activeChapter.activeRecallPrompt}</p>
              </div>
            </div>
          )}

          {/* Personal Book Study Notes */}
          <div className="space-y-2">
            <label
              htmlFor="book-personal-study-notes"
              className="block text-xs font-semibold text-zinc-200"
            >
              Your Personal Synthesis Notes for {activeBook.title}
            </label>
            <textarea
              id="book-personal-study-notes"
              rows={3}
              value={activeBookProgress.personalNotes}
              onChange={(e) =>
                onUpdateBookProgress({
                  book: activeBook,
                  personalNotes: e.target.value,
                })
              }
              placeholder={`Write your answers to the Active Recall prompt, chapter takeaways, or page citations for ${activeBook.title}...`}
              data-testid="study-book-personal-notes-textarea"
              className="w-full px-3.5 py-2.5 text-xs bg-[#0A0A0C] border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
