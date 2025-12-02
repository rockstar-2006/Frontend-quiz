import { useState, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Logo } from '@/components/Logo';
import { useGame } from '@/context/GameContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Play, ArrowLeft, Clock, Save, Upload } from 'lucide-react';
import { Question, Quiz } from '@/types/quiz';
import { v4 as uuidv4 } from 'uuid';

// Base URL for backend – same as in your API service
const RAW_BACKEND_URL =
  (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3001';
const BACKEND_URL = RAW_BACKEND_URL.replace(/\/$/, '');
const API_BASE_URL = `${BACKEND_URL}/api`;

const Host = () => {
  const navigate = useNavigate();
  const { quizzes, createQuiz, updateQuiz, deleteQuiz, createGame } = useGame();
  
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  
  // New quiz form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Current question form
  const [questionText, setQuestionText] = useState('');   // can contain code
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [timeLimit, setTimeLimit] = useState(15);

  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const resetQuestionForm = () => {
    setQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectIndex(0);
    setTimeLimit(15);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setQuestions([]);
    setEditingQuiz(null);
    resetQuestionForm();
    setImportError(null);
  };

  const addQuestion = () => {
    if (!questionText.trim() || options.some((o) => !o.trim())) return;

    const newQuestion: Question = {
      id: uuidv4(),
      text: questionText, // keep all line breaks
      options: [...options],
      correctIndex,
      timeLimit,
    };

    setQuestions((prev) => [...prev, newQuestion]);
    resetQuestionForm();
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const saveQuiz = async () => {
    if (!title.trim() || questions.length === 0) return;

    if (editingQuiz) {
      await updateQuiz({
        ...editingQuiz,
        title: title.trim(),
        description: description.trim(),
        questions,
      });
    } else {
      const newQuiz = await createQuiz(title.trim(), description.trim());
      await updateQuiz({ ...newQuiz, questions });
    }

    setView('list');
    resetForm();
  };

  const startEditing = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setTitle(quiz.title);
    setDescription(quiz.description);
    setQuestions([...quiz.questions]);
    setView('edit');
  };

  const startGame = async (quiz: Quiz) => {
    const pin = await createGame(quiz);
    navigate(`/lobby/${pin}`);
  };

  const handleDeleteQuiz = async (quizId: string) => {
    await deleteQuiz(quizId);
  };

  // ---------- TEXT IMPORT (backend route still called import-pdf) ----------

  const handlePdfUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Call backend endpoint: POST /api/quizzes/import-pdf
      // (backend now expects a text file and parses it)
      const res = await fetch(`${API_BASE_URL}/quizzes/import-pdf`, {
        method: 'POST',
        body: formData,
      });

      // Better error handling: read JSON error from backend
      if (!res.ok) {
        let message = `Import failed (${res.status})`;
        try {
          const err = await res.json();
          if (err?.error) {
            message = err.error;
            if (err.detail) {
              message += `: ${err.detail}`;
            }
          }
        } catch {
          // ignore JSON parse issues, keep default message
        }
        throw new Error(message);
      }

      // Expecting: { title, description, questions: QuestionLike[] }
      const data = await res.json();

      // Map backend questions into our Question type and ensure each has an id + default time
      const importedQuestions: Question[] = (data.questions || []).map((q: any) => ({
        id: q.id ?? q._id ?? uuidv4(),
        text: q.text ?? '',
        options: q.options ?? ['', '', '', ''],
        correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
        timeLimit: q.timeLimit ?? 15,
      }));

      if (!importedQuestions.length) {
        throw new Error('No questions found in the imported file.');
      }

      // Fill form from imported data
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      setQuestions(importedQuestions);
    } catch (err: any) {
      console.error(err);
      setImportError(err.message || 'Failed to import quiz from file.');
    } finally {
      setIsImporting(false);
      // reset the file input so user can upload again if needed
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <AnimatedBackground />

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => (view === 'list' ? navigate('/') : setView('list'))}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Logo size="sm" />
          <div className="w-20" />
        </header>

        <AnimatePresence mode="wait">
          {view === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold gradient-text">Your Quizzes</h1>
                <Button
                  variant="hero"
                  onClick={() => {
                    resetForm();
                    setView('create');
                  }}
                  className="gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Quiz
                </Button>
              </div>

              {quizzes.length === 0 ? (
                <motion.div
                  className="glass-card p-12 rounded-2xl text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-xl text-muted-foreground mb-4">No quizzes yet!</p>
                  <p className="text-muted-foreground">
                    Create your first quiz to get started.
                  </p>
                </motion.div>
              ) : (
                <div className="grid gap-4">
                  {quizzes.map((quiz, index) => (
                    <motion.div
                      key={quiz.id}
                      className="glass-card p-6 rounded-2xl"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-foreground mb-2">
                            {quiz.title}
                          </h3>
                          <p className="text-muted-foreground mb-3">
                            {quiz.description}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {quiz.questions.length} questions
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditing(quiz)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteQuiz(quiz.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="hero"
                            size="sm"
                            onClick={() => startGame(quiz)}
                            disabled={quiz.questions.length === 0}
                            className="gap-2"
                          >
                            <Play className="w-4 h-4" />
                            Start
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {(view === 'create' || view === 'edit') && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <h1 className="text-3xl font-bold gradient-text mb-8">
                {view === 'edit' ? 'Edit Quiz' : 'Create New Quiz'}
              </h1>

              <div className="grid gap-8">
                {/* Quiz details */}
                <div className="glass-card p-6 rounded-2xl">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Quiz Details
                  </h2>
                  <div className="grid gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">
                        Title
                      </label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter quiz title..."
                        className="bg-muted/50"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">
                        Description
                      </label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter quiz description..."
                        className="bg-muted/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Import from text file */}
                <div className="glass-card p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold text-foreground">
                      Import from Text File
                    </h2>
                    {isImporting && (
                      <span className="text-xs text-muted-foreground">
                        Reading file and extracting questions…
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a <span className="font-mono">.txt</span> file that contains your
                    questions and options (e.g. exported from a PDF or document). The backend
                    will parse it and fill in the quiz for you. You can still edit everything
                    after import.
                  </p>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="file"
                        accept=".txt,text/plain"
                        className="hidden"
                        onChange={handlePdfUpload}
                        disabled={isImporting}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        disabled={isImporting}
                        onClick={(e) => {
                          // trigger the hidden input
                          const input =
                            (e.currentTarget.previousSibling as HTMLInputElement | null);
                          input?.click();
                        }}
                      >
                        <Upload className="w-4 h-4" />
                        {isImporting ? 'Importing…' : 'Choose File'}
                      </Button>
                    </label>
                    <span className="text-xs text-muted-foreground">
                      Format: questions like <span className="font-mono">1. Question…</span>{' '}
                      options <span className="font-mono">A) …</span>{' '}
                      and an <span className="font-mono">Answer: A</span> line.
                    </span>
                  </div>

                  {importError && (
                    <p className="text-xs text-destructive mt-2">{importError}</p>
                  )}
                </div>

                {/* Questions list */}
                {questions.length > 0 && (
                  <div className="glass-card p-6 rounded-2xl">
                    <h2 className="text-xl font-semibold text-foreground mb-4">
                      Questions ({questions.length})
                    </h2>
                    <div className="grid gap-3">
                      {questions.map((q, index) => {
                        const isMultiline = q.text.includes('\n');
                        return (
                          <motion.div
                            key={q.id}
                            className="flex items-start justify-between p-4 bg-muted/30 rounded-xl gap-3"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <div className="flex-1">
                              {isMultiline ? (
                                <pre className="font-mono text-xs whitespace-pre-wrap text-left max-h-32 overflow-auto mb-1">
                                  {q.text}
                                </pre>
                              ) : (
                                <p className="font-medium text-foreground mb-1">
                                  {index + 1}. {q.text}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground mt-1">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {q.timeLimit}s • Answer: {q.options[q.correctIndex]}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeQuestion(index)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Add question form */}
                <div className="glass-card p-6 rounded-2xl">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Add Question
                  </h2>
                  <div className="grid gap-6">
                    {/* Question text (supports code) */}
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">
                        Question / Code
                      </label>
                      <Textarea
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        placeholder={`Type your question here, or paste code:

// Sample Java Program
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
}`}
                        className="bg-muted/50 font-mono text-xs min-h-[140px] whitespace-pre"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Line breaks and indentation are preserved – perfect for code
                        questions.
                      </p>
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {options.map((opt, index) => (
                        <div key={index}>
                          <label className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                            <span
                              className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                                index === 0
                                  ? 'bg-answer-red'
                                  : index === 1
                                  ? 'bg-answer-blue'
                                  : index === 2
                                  ? 'bg-answer-green'
                                  : 'bg-answer-yellow text-background'
                              }`}
                            >
                              {['A', 'B', 'C', 'D'][index]}
                            </span>
                            Option {index + 1}
                            {correctIndex === index && (
                              <span className="text-success text-xs">(Correct)</span>
                            )}
                          </label>
                          <div className="flex gap-2">
                            <Input
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...options];
                                newOpts[index] = e.target.value;
                                setOptions(newOpts);
                              }}
                              placeholder={`Answer ${index + 1}...`}
                              className="bg-muted/50"
                            />
                            <Button
                              variant={correctIndex === index ? 'success' : 'outline'}
                              size="sm"
                              onClick={() => setCorrectIndex(index)}
                            >
                              ✓
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Time limit */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <label className="text-sm text-muted-foreground">
                        Time limit:
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {[10, 15, 20, 30].map((t) => (
                          <Button
                            key={t}
                            variant={timeLimit === t ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={() => setTimeLimit(t)}
                          >
                            {t}s
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      onClick={addQuestion}
                      disabled={
                        !questionText.trim() || options.some((o) => !o.trim())
                      }
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Question
                    </Button>
                  </div>
                </div>

                {/* Save button */}
                <div className="flex justify-end gap-4">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setView('list');
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="hero"
                    onClick={saveQuiz}
                    disabled={!title.trim() || questions.length === 0}
                    className="gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Quiz
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Host;
