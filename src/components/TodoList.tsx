import { NetworkStatus, useMutation, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { CREATE_TODO, GET_TODO, UPDATE_TODO, DELETE_TODO } from "./queries";
import "./TodoList.css";
import { getDatabase } from "./schema/todoSchema";

const TodoList = () => {
  const [todos, setTodos] = useState<any[]>([]);
  const [db, setDb] = useState<any>(null);
  const [name, setName] = useState<string>("");
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

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

  const { error, data, networkStatus } = useQuery(GET_TODO, {
    returnPartialData: false,
    notifyOnNetworkStatusChange: false,
    onError: (error: any) => {
      console.error("GraphQL query error:", error);
    },
    // pollInterval: 5000, // to call api after certain period of time
    // skipPollAttempt:() => {
    //   return true;
    // }
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const syncWithGraphQL = async () => {
    try {
      const rxdbTodos = await db.todos.find().exec();

      // Handle creation and update for todos
      for (const todo of rxdbTodos) {
          if (!todo._rev) {
            console.log("Creating in GraphQL", todo);
            await createTodo({
              variables: {
                createtodoinput: {
                  name: todo.name,
                  done: todo.done,
                },
              },
            });
          } else {
            console.log("Updating in GraphQL", todo);
            await updateTodo({
              variables: {
                updatetodoinput: {
                  id: todo.id,
                  done: todo.done,
                },
              },
            });
          }
        }
    } catch (error) {
      console.error("Error syncing with GraphQL:", error);
    }
  };

  useEffect(() => {
    if (db) {
      const subscription = db.todos.find().$.subscribe(async (todos: any) => {
        if (isOnline) {
          console.log("App is online");
          await syncWithGraphQL();
        }
        setTodos(todos || []);
        setName("");
      });

      return () => subscription.unsubscribe();
    }
  }, [db, isOnline, syncWithGraphQL]);

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
      if (isOnline) {
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
      } else {
        if (db) {
          await db.todos?.insert({
            id: Date.now().toString(),
            name,
            done: false,
          });
        }
      }

      setName(""); // Clear input field after adding todo
    } catch (error) {
      console.error("Error adding todo:", error);
    }
  };

  const deleteTodoItem = async (id: string) => {
    try {
      if (db) {
        const todoFromRxDB = await db.todos?.findOne(id).exec();
        if (todoFromRxDB) {
          await todoFromRxDB.remove();
        } else {
          console.error(`Todo with ID ${id} not found in RxDB.`);
        }
      }

      if (isOnline) {
        // Attempt to delete from GraphQL if online
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
        const todoFromRxDB = await db.todos?.findOne(todoItem.id).exec();
        if (todoFromRxDB) {
          await todoFromRxDB.patch({ done: !todoFromRxDB.done });
        }

        if (isOnline) {
          await updateTodo({
            variables: {
              updatetodoinput: {
                id: todoItem.id,
                done: !todoItem.done,
              },
            },
          });
        }
      }
    } catch (error) {
      console.error("Error toggling todo:", error);
    }
  };

  if (networkStatus === NetworkStatus.poll) return <p>Refetching!</p>;
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
      <h4>Graph QLTodo List is {isOnline ? 'online' : 'offline'}</h4>
        {data.listTodos.items.map((todo: any) => (
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

        <h4>Todo List is {isOnline ? 'online' : 'offline'}</h4>
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