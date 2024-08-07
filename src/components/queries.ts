import { gql } from "@apollo/client";

export const GET_TODO = gql`
  query listTodos {
    listTodos {
      items {
        id
        name
        done
      }
    }
  }
`;

export const CREATE_TODO = gql`
  mutation createTodo($createtodoinput: CreateTodoInput!) {
    createTodo(input: $createtodoinput) {
      id
      name
      done
    }
  }
`;

export const DELETE_TODO = gql`
  mutation deleteToDo($deletetodoinput: DeleteTodoInput!) {
    deleteTodo(input: $deletetodoinput) {
      id
    }
  }
`;

export const UPDATE_TODO = gql`
  mutation updateToDo($updatetodoinput: UpdateTodoInput!) {
    updateTodo(input: $updatetodoinput) {
      id
    }
  }
`;