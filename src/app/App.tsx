import ThemeProvider from '@mui/material/styles/ThemeProvider';
import { createTheme } from '@mui/material/styles';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Component } from 'react';
import { EditorPage } from '@ui/pages/EditorPage';
import { getAppBasePath } from '@app/config';

const theme = createTheme({
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica',
      'Arial',
      'sans-serif',
      'Apple Color Emoji',
      'Segoe UI Emoji',
      'Segoe UI Symbol',
      'Gentium Book Plus',
    ].join(','),
    h2: {
      fontFamily: 'Gentium Book Plus',
      fontSize: '3em',
    },
    h3: {
      fontFamily: 'Gentium Book Plus',
      fontSize: '2em',
    },
    h4: {
      fontFamily: 'Gentium Book Plus',
      fontSize: '1em',
    },
  },
  palette: {
    primary: {
      main: '#262d4f',
    },
  },
});

const basePath = getAppBasePath();
const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <EditorPage></EditorPage>,
    },
    {
      path: '*',
      element: <EditorPage></EditorPage>,
    },
  ],
  {
    basename: basePath === '/' ? undefined : basePath,
  },
);

class App extends Component {
  render() {
    return (
      <ThemeProvider theme={theme}>
        <RouterProvider router={router} />
      </ThemeProvider>
    );
  }
}

export default App;
