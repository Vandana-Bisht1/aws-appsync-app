import { useMutation, useQuery } from "@apollo/client";
import { useState } from "react";
import { CREATE_TODO, GET_TODO, UPDATE_TODO, DELETE_TODO } from "./queries";
import "./TodoList.css";

const TodoList = () => {
  const { loading, error, data } = useQuery(GET_TODO);
  const [createTodo] = useMutation(CREATE_TODO, {
    refetchQueries: [{ query: GET_TODO }],
  });
  const [updateTodo] = useMutation(UPDATE_TODO, {
    refetchQueries: [{ query: GET_TODO }],
  });
  const [deleteTodo] = useMutation(DELETE_TODO, {
    refetchQueries: [{ query: GET_TODO }],
  });
  const [name, setName] = useState<string>("");

  const addTodo = () => {
    createTodo({
      variables: {
        createtodoinput: {
          name,
          done: false,
        },
      },
    });
    setName("");
  };

  const deleteTodoItem = (id: any) => {
    deleteTodo({
      variables: {
        deletetodoinput: {
          id: id,
        },
      },
    });
  };

  const toggleTodo = (todo: any) => {
    updateTodo({
      variables: {
        updatetodoinput: {
          id: todo.id,
          done: !todo.done,
        },
      },
    });
  };

  if (loading) return <p className="loading">Loading...</p>;
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
      </div>
    </div>
  );
};

export default TodoList;