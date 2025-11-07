import { Routes, Route } from 'react-router-dom';

const App = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route path="/" element={<h1 className="text-center py-10">首页</h1>} />
        <Route path="/login" element={<h1 className="text-center py-10">登录页</h1>} />
      </Routes>
    </div>
  );
};

export default App;