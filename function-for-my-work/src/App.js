import './App.css';
import CSVPreviewApp from './react-csv/CSVPreviewApp';
import ImageDisplay from './react-image/ImageDisplay';

function App() {
      const imageData = {
        content: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MDAgNjAwIj48ZGVmcz48cmFkaWFsR3JhZGllbnQgaWQ9ImEiIGN4PSI0MDAiIGN5PSIzMDAiIHI9IjUwMCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iIzQzMTA4QSIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzFBMDUzNiIvPjwvcmFkaWFsR3JhZGllbnQ+PGZpbHRlciBpZD0iYiI+PGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMTIiLz48L2ZpbHRlcj48L2RlZnM+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9InVybCgjYSkiLz48ZyBmaWx0ZXI9InVybCgjYikiIG9wYWNpdHk9Ii43Ij48Y2lyY2xlIGN4PSIyMDAiIGN5PSIzMDAiIHI9IjYwIiBmaWxsPSIjODgzNEZGIi8+PGNpcmNsZSBjeD0iNTgwIiBjeT0iNDAwIiByPSI0MCIgZmlsbD0iIzhCNUNGRiIgb3BhY2l0eT0iLjgiLz48Y2lyY2xlIGN4PSIzNTAiIGN5PSIxNjAiIHI9IjMwIiBmaWxsPSIjQkE4QkZGIiBvcGFjaXR5PSIuNiIvPjxjaXJjbGUgY3g9IjQ5MCIgY3k9IjMzMCIgcj0iNzAiIGZpbGw9IiM1QzE2RkYiIG9wYWNpdHk9Ii45Ii8+PHBhdGggZD0iTTQwMCwzMDAgTDQ1MCwxMDAgTDQ3MCwzMzAgTDY1MCwyMDAgTDQ5MCw0MDAgTDgwMCw0NTAgTDQ3MCw0ODAgTDUwMCw2MDAgTDM4MCw0NzAgTDMwMCw1MDAgTDM2MCwzODAgTDE1MCwzNTAgTDM3MCwzMzAgTDIwMCwxNzAgTDM4MCwyMzAiIHN0cm9rZT0iI0QzQTRGRiIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIiBvcGFjaXR5PSIuMyIvPjwvZz48cGF0aCBkPSJNNDAwLDMwMCBtLTgwLDAgYTgwLDgwIDAgMSwwIDE2MCwwIGE4MCw4MCAwIDEsMCAtMTYwLDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0ZGQzNGQiIgc3Ryb2tlLXdpZHRoPSIyIiBvcGFjaXR5PSIuOCIvPjxjaXJjbGUgY3g9IjQwMCIgY3k9IjMwMCIgcj0iMTAwIiBmaWxsPSJub25lIiBzdHJva2U9IiNGRkMyRkEiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWRhc2hhcnJheT0iMTAsMTUiIG9wYWNpdHk9Ii42Ii8+PHRleHQgeD0iNDAwIiB5PSIzMDUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iI0ZGRUVGQiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+5pmu5bKb5LmL5aSp5Zu+PC90ZXh0Pjwvc3ZnPg==",
        name: "FOKE-framework.jpg",
        lastModified: "2025/04/25 13:27:36",
    };


  return (
    <ImageDisplay 
        imageData={imageData}
        showDetails={true}
        showControls={true}
        imageInitialHeight="80vh"
        className="border border-gray-200"
      />
  );
}

export default App;


// import './App.css';
// // import CSVPreviewApp from './react-csv/CSVPreviewApp';
// import { CSVLink, CSVDownload } from "react-csv";


// function App() {
  
// const csvData = [
//   ["firstname", "lastname", "email"],
//   ["Ahmed", "Tomi", "ah@smthing.co.com"],
//   ["Raed", "Labes", "rl@smthing.co.com"],
//   ["Yezzi", "Min l3b", "ymin@cocococo.com"]
// ];

//   return (
//     <div className="App">
//       <CSVLink data={csvData}>Download me</CSVLink>;
//       <CSVDownload data={csvData} target="_blank" />;
//     </div>
//   );
// }

// export default App;
