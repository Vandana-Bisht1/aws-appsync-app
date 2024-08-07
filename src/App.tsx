import './App.css';
import TodoList from './components/TodoList';
import client from './components/apolloClient';
import { ApolloProvider } from '@apollo/client';

function App() {
  console.log("client", client)
  return (
    <ApolloProvider client={client}>
    <div className="App">
      <TodoList />
    </div>
    </ApolloProvider>
  );
}

export default App;
