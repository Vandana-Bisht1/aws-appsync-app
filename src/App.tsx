import { Suspense } from "react";
import "./App.css";
import TodoList from "./components/TodoList";
import client from "./components/apolloClient";
import { ApolloProvider } from "@apollo/client";
import { PARTIAL_GET_DOG_QUERY } from "./components/queries";

function App() {
  // client.writeQuery({
  //   query: PARTIAL_GET_DOG_QUERY,
  //   data: {
  //     listTodos: {
  //       items: [
  //         {
  //           id: "1",
  //           name: "partial temp name",
  //           done: false,
  //         },
  //       ],
  //     },
  //   },
  // });
  return (
    <ApolloProvider client={client}>
      <div className="App">
        <Suspense fallback={<div>Loading data...</div>}>
          <TodoList />
        </Suspense>
      </div>
    </ApolloProvider>
  );
}

export default App;
