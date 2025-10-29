import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  DndContext,
  useDraggable,
  useSensors,
  useSensor,
  PointerSensor,
} from "@dnd-kit/core";

// Draggable Task Card
function DraggableTask({ task, onDelete, onCommitMove, toggleComplete }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id });

  const style = useMemo(() => ({
    position: "absolute",
    left: task.x,
    top: task.y,
    width: task.w || 240,
    // auto height to fit content
    // height: task.h || 130,
    minHeight: 100,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    touchAction: "none",
    opacity: task.completed ? 0.6 : 1,
  }), [task.x, task.y, task.w, task.h, transform, task.completed]);

  const priorityColors = {
    low: "bg-blue-600 text-white",
    medium: "bg-yellow-400 text-black",
    high: "bg-red-500 text-white",
  };

  const getDueMeta = () => {
    if (!task.dueDate) return { label: "No date", cls: "bg-white/10 text-neutral-300" };
    const today = new Date(); today.setHours(0,0,0,0);
    const d = new Date(task.dueDate); d.setHours(0,0,0,0);
    const diff = (d - today) / 86400000;
    if (diff < 0) return { label: "Overdue", cls: "bg-rose-500 text-white" };
    if (diff === 0) return { label: "Today", cls: "bg-indigo-500 text-white" };
    if (diff === 1) return { label: "Tomorrow", cls: "bg-amber-400 text-black" };
    return { label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), cls: "bg-emerald-500 text-white" };
  };

  const categoryIcons = {
    work: "💼",
    personal: "🏠",
    school: "📚",
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className="group bg-neutral-800 border border-neutral-700 rounded-2xl shadow-md cursor-grab active:cursor-grabbing select-none overflow-hidden"
      onPointerUp={() => {
        if (transform) onCommitMove(task.id, task.x + transform.x, task.y + transform.y, task.w || 240, (task.h || 100));
      }}
    >
      <div className="flex items-center justify-between px-3 py-2 bg-white/5">
        <div className="flex flex-col gap-1">
          <span
            className={`inline-block font-medium ${task.completed ? "line-through text-neutral-400" : "text-neutral-100"}`}
            onClick={() => toggleComplete(task.id)}
          >
            {task.text}
          </span>
          <div className="flex gap-2 text-xs items-center">
            <span className={`px-2 py-0.5 rounded-full ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-white">
              {categoryIcons[task.category]} {task.category}
            </span>
            <span className={`px-2 py-0.5 rounded-full ${getDueMeta().cls}`}>
              {getDueMeta().label}
            </span>
          </div>
        </div>
        <button onClick={() => onDelete(task.id)} className="px-2 text-rose-300 hover:text-rose-200 font-bold">✕</button>
      </div>
    </div>
  );
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [priority, setPriority] = useState("low");
  const [category, setCategory] = useState("personal");
  const [darkMode, setDarkMode] = useState(true);
  const [newDueDate, setNewDueDate] = useState("");
  const canvasRef = useRef(null);

  const sensors = useSensors(useSensor(PointerSensor));

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("tasks");
    if (saved) setTasks(JSON.parse(saved));
    const theme = localStorage.getItem("theme");
    if (theme) setDarkMode(theme === "dark");
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    localStorage.setItem("theme", darkMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", darkMode);
  }, [tasks, darkMode]);

  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
  const rectsOverlap = (a, b) => !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);

  const findFreePosition = (w, h) => {
    const canvas = canvasRef.current;
    const cw = canvas ? canvas.clientWidth : window.innerWidth;
    const ch = canvas ? canvas.clientHeight : Math.round(window.innerHeight * 0.72);
    const step = 24;

    for (let y = 12; y <= ch - h; y += step) {
      for (let x = 12; x <= cw - w; x += step) {
        const candidate = { x, y, w, h };
        const overlap = tasks.some((t) => rectsOverlap(candidate, { x: t.x, y: t.y, w: t.w || 240, h: t.h || 130 }));
        if (!overlap) return { x, y };
      }
    }
    return { x: clamp(cw - w - 12, 12, cw - w), y: clamp(ch - h - 12, 12, ch - h) };
  };

  const commitMove = (id, x, y, w, h) => {
    const canvas = canvasRef.current;
    const cw = canvas ? canvas.clientWidth : window.innerWidth;
    const ch = canvas ? canvas.clientHeight : Math.round(window.innerHeight * 0.72);

    let nx = clamp(x, 0, cw - w);
    let ny = clamp(y, 0, ch - h);

    const step = 12;
    const isOverlap = (X, Y) => tasks.some((t) => t.id !== id && rectsOverlap({ x: X, y: Y, w, h }, { x: t.x, y: t.y, w: t.w || 240, h: t.h || 130 }));

    if (isOverlap(nx, ny)) {
      outer: for (let radius = step; radius < 400; radius += step) {
        for (let dx = -radius; dx <= radius; dx += step) {
          for (let dy = -radius; dy <= radius; dy += step) {
            const tx = clamp(nx + dx, 0, cw - w);
            const ty = clamp(ny + dy, 0, ch - h);
            if (!isOverlap(tx, ty)) { nx = tx; ny = ty; break outer; }
          }
        }
      }
    }

    setTasks((p) => p.map((t) => (t.id === id ? { ...t, x: nx, y: ny } : t)));
  };

  const toggleComplete = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    const w = 240, h = 130;
    const pos = findFreePosition(w, h);
    setTasks((prev) => [
      ...prev,
      { id: Date.now().toString(), text: newTask.trim(), x: pos.x, y: pos.y, w, h, priority, category, completed: false, dueDate: newDueDate || null },
    ]);
    setNewTask("");
  };

  const handleDeleteTask = (id) => setTasks((p) => p.filter((t) => t.id !== id));

  return (
    <div className={`min-h-screen p-6 ${darkMode ? "bg-neutral-950" : "bg-gradient-to-br from-blue-100 to-purple-200"}`}>
      <div className="max-w-5xl mx-auto">
        {/* Toolbar */}
        <div className="sticky top-4 z-50 backdrop-blur bg-white/5 border border-white/10 rounded-2xl shadow p-4 mb-4 flex flex-col gap-2">
          {/* Title */}
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-indigo-400">TaskCanvas: Free-Drag To‑Do Board</h1>
            <p className="text-sm text-neutral-400 mt-1">A spatial canvas for tasks and notes.</p>
          </div>

          {/* Input + Add button */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add a new task..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              className="border border-white/10 bg-white/10 text-neutral-100 placeholder:text-neutral-400 rounded-xl px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
            <button onClick={handleAddTask} className="bg-indigo-600 text-white px-4 py-2 rounded-xl shadow">Add</button>
          </div>

          {/* Feature selectors below input */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl px-2 py-1 text-neutral-100 bg-white/10 border border-white/10">
              <option value="work">💼 Work</option>
              <option value="personal">🏠 Personal</option>
              <option value="school">📚 School</option>
            </select>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}
              className="rounded-xl px-2 py-1 text-neutral-100 bg-white/10 border border-white/10">
              <option value="low">🔵 Low</option>
              <option value="medium">🟡 Medium</option>
              <option value="high">🔴 High</option>
            </select>

            {/* Due date quick picks */}
            <button onClick={() => setNewDueDate(new Date().toISOString().slice(0,10))}
              className="px-3 py-1 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500">Today</button>
            <button onClick={() => {
              const t = new Date(); t.setDate(t.getDate()+1);
              setNewDueDate(t.toISOString().slice(0,10));
            }} className="px-3 py-1 rounded-xl bg-amber-400 text-black hover:bg-amber-300">Tomorrow</button>
            <input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)}
              className="rounded-xl px-2 py-1 text-neutral-100 bg-white/10 border border-white/10" />

            <button onClick={() => setDarkMode(!darkMode)}
              className="bg-white/10 text-white px-3 py-1 rounded-xl">{darkMode ? "☀️ Light" : "🌙 Dark"}</button>
          </div>
        </div>

        {/* Canvas */}
        <DndContext sensors={sensors}>
          <div ref={canvasRef} className="relative w-full h-[72vh] md:h-[78vh] rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden shadow-inner">
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,.08)_1px,transparent_0)] [background-size:18px_18px]" />
            {tasks.map((task) => (
              <DraggableTask
                key={task.id}
                task={task}
                onDelete={handleDeleteTask}
                onCommitMove={commitMove}
                toggleComplete={toggleComplete}
              />
            ))}
          </div>
        </DndContext>
      </div>
    </div>
  );
}
