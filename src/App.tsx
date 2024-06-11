import ThemeProvider from '@mui/material/styles/ThemeProvider';
import { createTheme } from '@mui/material/styles';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { HomePage } from './homepage/homepage';
import { Component } from 'react';

const theme = createTheme({
  typography: {
    fontFamily: [
      "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol",
      'Gentium Book Plus'
    ].join(','),
    h2: {
      fontFamily: 'Gentium Book Plus',
      fontSize: '3em'
    },
    h3: {
      fontFamily: 'Gentium Book Plus',
      fontSize: '2em'
    },
    h4: {
      fontFamily: 'Gentium Book Plus',
      fontSize: '1em'
    }
  },
  palette: {
    primary: {
      main: '#262d4f'
    }
  }
});

const router = createBrowserRouter([
  {
    path: "/hellomunchkins/client",
    element: (<HomePage></HomePage>),
  },
]);

class App extends Component {
  render() {
    return (
        <ThemeProvider theme={theme}>
          <RouterProvider router={router} />
        </ThemeProvider>
    )
  }
}

export default App;
