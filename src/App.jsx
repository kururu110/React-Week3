import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import axios from "axios";
import "./assets/style.css";

// API 設定
const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

function App() {
  // 表單資料狀態(儲存登入表單輸入)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  // 登入狀態管理(控制顯示登入或產品頁）
  const [isAuth, setIsAuth] = useState(false);

  const [products, setProducts] = useState([]);
  const [tempProduct, setTempProduct] = useState(null);

  const handleInputChange = (e) =>{
    const { name , value } = e.target;
    // console.log(name,value)
    setFormData((preData) =>({
      ...preData,
      [name]:value,
    }));
  }

  const getProducts = async () =>{
    try {
      const response = await axios.get(`${API_BASE}/api/${API_PATH}/admin/products`);
      setProducts(response.data.products);
    } catch (error){
      console.error("載入失敗", error.response);
    }
  }

  const onSubmit = async (e) =>{
    try {
      e.preventDefault();
      const response = await axios.post(`${API_BASE}/admin/signin`, formData);
      // console.log(response)
      const {token, expired} = response.data;
      document.cookie = `hextoken=${token};expires=${new Date(expired)};`;
      axios.defaults.headers.common["Authorization"] = token;

      const responseCheck = await axios.post(`${API_BASE}/api/user/check`);
      console.log("檢查登入狀態回應", responseCheck);
      
      getProducts();
      setIsAuth(true);
      
    } catch (error) {
      setIsAuth(false);
      console.error("登入失敗:", error.response?.data?.message || error.message);
      alert("登入失敗，請檢查帳號密碼是否正確");
    }
  }

  const checkLogin = async () =>{
    try {
      // 從 Cookie 取得 token
      const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("hextoken="))
      ?.split("=")[1];
      axios.defaults.headers.common["Authorization"] = token;

      const response = await axios.post(`${API_BASE}/api/user/check`);
      console.log("檢查登入狀態回應：", response);
      setIsAuth(true);
      getProducts();
    } catch (error) {
      console.log(error.response?.data.message);
      alert("登入狀態異常，請重新登入");
      setIsAuth(false);
    }
  }

  return (
    <>
    {!isAuth ? (
      <div className='container'>
        <h1>請先登入</h1>
        <form onSubmit={(e)=> onSubmit(e)}>
          <div className="form-floating mb-3">
            <input type="email" className="form-control" name="username" placeholder="name@example.com" value={formData.username} onChange={(e) => handleInputChange(e)} />
            <label htmlFor="floatingInput">Email address</label>
            </div>
          <div className="form-floating">
            <input type="password" className="form-control" name="password" placeholder="Password" value={formData.password} onChange={(e) => handleInputChange(e)} />
            <label htmlFor="floatingPassword">Password</label>
          </div>
          <button className='btn btn-primary mt-2' type='submit'>登入</button>
        </form>
    </div>) : (
      <>
      <div className="container">
        <button className="btn btn-danger mb-5" type="button" onClick={checkLogin}>確認是否登入</button></div>
        <div className="container">
          <div className="row mt-5">
            <div className="col-md-6">
              <h2>產品列表</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{width:"200px"}}>產品名稱</th>
                    <th style={{width:"200px"}}>原價</th>
                    <th style={{width:"200px"}}>售價</th>
                    <th style={{width:"200px"}}>是否啟用</th>
                    <th style={{width:"200px"}}>查看細節</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <th scope="row">{product.title}</th>
                      <td>{product.origin_price}</td>
                      <td>{product.price}</td>
                      <td>{product.is_enabled ? "啟用" : "未啟用" }</td>
                      <td>
                        <button className="btn btn-primary" onClick={() => setTempProduct(product)}>查看細節</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="col-md-6">
              <h2>單一產品細節</h2>
              {tempProduct ? (
                <div className="card mb-3">
                  <img src={tempProduct.imageUrl} className="card-img-top primary-image" alt="主圖" />
                  <div className="card-body">
                    <h5 className="card-title">
                      {tempProduct.title}
                      <span className="badge bg-primary ms-2">{tempProduct.category}</span>
                    </h5>
                    <p className="card-text">商品描述：{tempProduct.description}</p>
                    <p className="card-text">商品內容：{tempProduct.content}</p>
                    <div className="d-flex">
                      <p className="card-text text-secondary"><del>{tempProduct.origin_price}</del></p>
                      元 / {tempProduct.price} 元
                    </div>
                    <h5 className="mt-3">更多圖片：</h5>
                    <div className="d-flex flex-wrap">
                      {tempProduct.imagesUrl?.map((url,index) =>(
                      <img key={index}
                        src={url}
                        style={{width:"300px"}}/>))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-secondary">請選擇一個商品查看</p>
              )}
            </div>
          </div>
        </div>
        </>
    )}
    </>
  );
}

export default App;
