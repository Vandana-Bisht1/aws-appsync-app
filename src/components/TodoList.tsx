import { NetworkStatus, useMutation, useQuery } from "@apollo/client";
import { startTransition, useEffect, useState } from "react";
import { CREATE_TODO, GET_TODO, UPDATE_TODO, DELETE_TODO } from "./queries";
import "./TodoList.css";
import { getDatabase } from "./schema/todoSchema";

const TodoList = () => {
  const [todos, setTodos] = useState<any[]>([]);
  const [db, setDb] = useState<any>(null);
  const [name, setName] = useState<string>("");

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        const database = await getDatabase();
        setDb(database);
        const todosList = await database.todos?.find().exec();
        setTodos(todosList || []);
      } catch (error) {
        console.error("Failed to initialize database:", error);
      }
    };
    initializeDatabase();
  }, []);

  const { error, data, networkStatus, refetch } = useQuery(GET_TODO, {
    returnPartialData: false,
    notifyOnNetworkStatusChange: false,
    onError: (error: any) => {
      console.error("GraphQL query error:", error);
    },
    pollInterval: 5000, // to call api after certain period of time
    // skipPollAttempt:() => {
    //   return true;
    // }
  });

  useEffect(() => {
    if (data) {
      if (db) {
        data?.listTodos.items.map(async (item: any) => {
          const existingTodo = await db.todos.findOne(item.id).exec();
          if (existingTodo) {
            await db.todos.upsert({
              id: item.id,
              name: item.name,
              done: item.done,
              _rev: existingTodo._rev,
            });
          } else {
            await db.todos.insert({
              id: item.id,
              name: item.name,
              done: item.done,
            });
          }
        });
      }
    }
  }, [data, db]);

  useEffect(() => {
    if (db) {
      const subscription = db.todos.find().$.subscribe(async (todos: any) => {
        startTransition(() => {
          refetch();
        });
        // Manually trigger a refresh of RxDB data
        setTodos(todos || []);
        setName("");
      });

      // Cleanup subscription on component unmount
      return () => subscription.unsubscribe();
    }
  }, [db, refetch]);

  const [createTodo] = useMutation(CREATE_TODO, {
    onError: (error) => {
      console.error("GraphQL mutation error:", error);
    },
    refetchQueries: [{ query: GET_TODO }],
  });
  const [updateTodo] = useMutation(UPDATE_TODO, {
    onError: (error) => {
      console.error("GraphQL mutation error:", error);
    },
    refetchQueries: [{ query: GET_TODO }],
  });
  const [deleteTodo] = useMutation(DELETE_TODO, {
    onError: (error) => {
      console.error("GraphQL mutation error:", error);
    },
    refetchQueries: [{ query: GET_TODO }],
  });

  const addTodo = async () => {
    if (name.trim() === "") {
      return;
    }
    try {
      const { data } = await createTodo({
        variables: {
          createtodoinput: {
            name,
            done: false,
          },
        },
      });

      const newTodoId = data.createTodo.id;

      if (db) {
        await db.todos?.insert({
          id: newTodoId,
          name,
          done: false,
        });
      }

      setName(""); // Clear input field after adding todo
    } catch (error) {
      console.error("Error adding todo:", error);
    }
  };

  const deleteTodoItem = async (id: string) => {
    try {
      if (db) {
        // Remove from RxDB
        const todoFromRxDB = await db.todos?.findOne(id).exec();
        if (todoFromRxDB) {
          await todoFromRxDB.remove();
        } else {
          console.error(`Todo with ID ${id} not found in RxDB.`);
        }

        // Remove from GraphQL
        await deleteTodo({
          variables: {
            deletetodoinput: {
              id: id,
            },
          },
        });
      }
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  };

  const toggleTodo = async (todoItem: any) => {
    try {
      if (db) {
        // Toggle status in RxDB
        const todoFromRxDB = await db.todos?.findOne(todoItem.id).exec();
        if (todoFromRxDB) {
          await todoFromRxDB.patch({ done: !todoFromRxDB.done });
        }

        // Update status in GraphQL
        await updateTodo({
          variables: {
            updatetodoinput: {
              id: todoItem.id,
              done: !todoItem.done,
            },
          },
        });
      }
    } catch (error) {
      console.error("Error toggling todo:", error);
    }
  };

  if (networkStatus === NetworkStatus.poll) return <p>Refetching!</p>;
  // if (loading) return <p className="loading">Loading...</p>;
  if (error) return <p className="error">Error: {error.message}</p>;

  return (
    <div className="todo-list">
      <h2>Todo List (GraphQL with Apollo Client)</h2>
      <div className="add-todo">
        <input
          type="text"
          placeholder="Add a todo"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={addTodo}>Add Todo</button>
      </div>
      <div>
        <h4>GraphQL Todo List</h4>
        {data?.listTodos.items.map((todo: any) => (
          <li key={todo.id} className="todo-item">
            <span className={todo.done ? "todo-name done" : "todo-name"}>
              {todo.name}
            </span>
            <div className="todo-buttons">
              <button
                className="delete-btn"
                onClick={() => deleteTodoItem(todo.id)}
              >
                Delete
              </button>
              <button className="done-btn" onClick={() => toggleTodo(todo)}>
                {todo.done ? "Undo" : "Done"}
              </button>
            </div>
          </li>
        ))}
      </div>
      <h4>RxDB Todo List</h4>
      <div>
        {todos.map((todo: any) => (
          <li key={todo.id} className="todo-item">
            <span className={todo.done ? "todo-name done" : "todo-name"}>
              {todo.name}
            </span>
            <div className="todo-buttons">
              <button
                className="delete-btn"
                onClick={() => deleteTodoItem(todo.id)}
              >
                Delete
              </button>
              <button className="done-btn" onClick={() => toggleTodo(todo)}>
                {todo.done ? "Undo" : "Done"}
              </button>
            </div>
          </li>
        ))}
      </div>
    </div>
  );
};

export default TodoList;