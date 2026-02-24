//定義useRef後需要匯入
import { useEffect, useState, useRef } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import axios from "axios";
import "./assets/style.css";
import * as bootstrap from "bootstrap";

// API 設定
const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

// 產品初始資料模板
const INITIAL_TEMPLATE_DATA = {
  id: "",
  title: "",
  category: "",
  origin_price: "",
  price: "",
  unit: "",
  description: "",
  content: "",
  is_enabled: false,
  imageUrl: "",
  imagesUrl: [],
};

function App() {
  // 表單資料狀態(儲存登入表單輸入)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  // 登入狀態管理(控制顯示登入或產品頁）
  const [isAuth, setIsAuth] = useState(false);

  const [products, setProducts] = useState([]);
  const [tempProduct, setTempProduct] = useState(INITIAL_TEMPLATE_DATA);
  const [modalType, setModalType] = useState("");

  // useRef 建立對 DOM 元素的參考，這裡用於控制產品Modal的顯示與隱藏
  const productModalRef = useRef(null);

  const handleInputChange = (e) =>{
    const { name , value } = e.target;
    // console.log(name,value)
    setFormData((preData) =>({
      ...preData,
      [name]:value,
    }));
  }

  // Modal中變更欄位輸入的函式
  const handleModalInputChange = (e) =>{
    const { name, value, checked, type } = e.target;
    setTempProduct((pre) => ({
      ...pre,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  // Modal中變更圖片的函式
  const handleModalImageChange = (index, value) =>{
    setTempProduct((pre) =>{
      const newImage = [...pre.imagesUrl];
      newImage[index] = value;

      if (value !== "" && index === newImage.length-1 && newImage.length < 5){
        newImage.push("");
      }
      if (value === "" && newImage.length > 1 && newImage[newImage.length-1] === ""){
        newImage.pop();
      }
      return {
        ...pre,
        imagesUrl: newImage,
      };
    })
  }

  // Modal中新增圖片的函式
  const handleAddImage = () =>{
    setTempProduct((pre) =>{
      const newImage = [...pre.imagesUrl];
      newImage.push("");
      return {
        ...pre,
        imagesUrl: newImage,
      };
    })
  }

  // Modal中刪除圖片的函式
  const handleDeleteImage = () =>{
    setTempProduct((pre) =>{
      const newImage = [...pre.imagesUrl];
      newImage.pop();
      return {
        ...pre,
        imagesUrl: newImage,
      };
    })
  }

  // 從後端取得API資料的函式
  const getProducts = async () =>{
    try {
      const response = await axios.get(`${API_BASE}/api/${API_PATH}/admin/products`);
      setProducts(response.data.products);
    } catch (error){
      console.error("載入失敗", error.response);
    }
  }

  // 更新產品的函式
  const updateProduct = async (id) => {
    let url = `${API_BASE}/api/${API_PATH}/admin/product`;
    let method = "post";

    if (modalType === "edit"){
      url = `${API_BASE}/api/${API_PATH}/admin/product/${id}`;
      method = "put";
    }

    // 處理產品資料格式，符合後端API要求
    const productData = {
      data: {
        ...tempProduct,
        origin_price: Number(tempProduct.origin_price),
        price: Number(tempProduct.price),
        is_enabled: tempProduct.is_enabled ? 1 : 0,
        imagesUrl: tempProduct.imagesUrl.filter((url) => url !== ""),
      },
    }

    // 根據modal type決定更新或是新增產品
    try {
      const response = await axios[method](url, productData);
      console.log(response.data);
      getProducts();
      closeModal();
    } catch (error) {
      console.log(error.response);
    }
  }

  // 刪除產品的函式
  const deleteProduct = async (id) => {
    try {
      const response = await axios.delete(`${API_BASE}/api/${API_PATH}/admin/product/${id}`);
      console.log(response.data);
      getProducts();
      closeModal();
    } catch (error) {
      console.log(error.response);
    };
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
          const response = await axios.post(`${API_BASE}/api/user/check`);
          console.log("檢查登入狀態回應：", response);
          setIsAuth(true);
          getProducts();
        } catch (error) {
          console.log(error.response?.data.message);
          alert("登入狀態異常，請重新登入");
          setIsAuth(false);
        }
      };

  useEffect(() => {
    // 從 Cookie 取得 token
      const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("hextoken="))
      ?.split("=")[1];
      if (token) {
        axios.defaults.headers.common["Authorization"] = token;
        checkLogin();
      } else {
        setIsAuth(false);
      }

      // 在 useEffect 中初始化
      productModalRef.current = new bootstrap.Modal("#productModal", {
        keyboard:false,
      })
    },[]);

    // 打開Modal的函式
    const openModal = (type, product) => {
      // console.log(product);
      setModalType(type);
      setTempProduct((pre) => ({
        ...pre,
        ...product,
      }));
      productModalRef.current.show();
    }

    // 關閉Modal的函式
    const closeModal = () => {
      productModalRef.current.hide();
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
          <div className="row mt-5">
            <div className="col-md-6">
              <h2>產品列表</h2>
              <div className="text-end mt-4">
                {/* 新增產品按鈕 */}
                <button type="button" className="btn btn-primary" onClick={() => openModal("create", INITIAL_TEMPLATE_DATA)}>建立新的產品</button></div>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{width:"200px"}}>分類</th>
                    <th style={{width:"250px"}}>產品名稱</th>
                    <th style={{width:"200px"}}>原價</th>
                    <th style={{width:"200px"}}>售價</th>
                    <th style={{width:"200px"}}>是否啟用</th>
                    <th style={{width:"200px"}}>編輯</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.category}</td>
                      <th scope="row">{product.title}</th>
                      <td>{product.origin_price}</td>
                      <td>{product.price}</td>
                      <td>{product.is_enabled ? "啟用" : "未啟用" }</td>
                      <td>
                        <div className="btn-group">
                          <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => openModal("edit", product)}>編輯</button>
                          <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => openModal("delete", product)}>刪除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </>
    )}
    <div className="modal fade" id="productModal" tabIndex="-1" aria-labelledby="productModalLabel" aria-hidden="true" ref={productModalRef}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="productModalLabel">Modal title</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <div className="modal-content border-0">
            <div className={`modal-header bg-${modalType === 'delete' ? 'danger' : 'dark'} text-white`}>
            <h5 id="productModalLabel" className="modal-title"><span>{modalType === 'delete' ? '刪除' : modalType === 'edit' ? '編輯' : '新增'}產品</span></h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            {
              modalType === 'delete' ? (
                <p className="fs-4">確定要刪除<span className="text-danger">{tempProduct.title}</span>嗎？</p>
              ) : (
                <div className="row">
              <div className="col-sm-4">
                <div className="mb-2">
                  <div className="mb-3">
                    <label htmlFor="imageUrl" className="form-label">輸入圖片網址</label>
                    <input type="text" id="imageUrl" name="imageUrl" className="form-control" placeholder="請輸入圖片連結" value={tempProduct.imageUrl} onChange={(e) => handleModalInputChange(e)}/>
                  </div>{
                    tempProduct.imageUrl && (
                      <img className="img-fluid" src={tempProduct.imageUrl} alt="主圖" />
                    )
                  }</div>
            <div>
              {
                tempProduct.imagesUrl.map((url, index) =>(
                  <div key={index}>
                    <label htmlFor="imageUrl" className="form-label">輸入圖片網址</label>
                    <input type="text" className="form-control"
                    placeholder={`圖片網址${index + 1}`}
                    value={url}
                    onChange={(e) => handleModalImageChange(index, e.target.value)}
                    />
                    {
                      url &&
                      <img className="img-fluid" src={url} alt={`副圖${index + 1}`}/>
                    }
                    
                  </div>
                ))
              }
              <button className="btn btn-outline-primary btn-sm d-block w-100" onClick={(e) => handleAddImage(e)}>新增圖片</button>
            </div>
            <div>
              <button className="btn btn-outline-danger btn-sm d-block w-100" onClick={(e) => handleDeleteImage(e)}>刪除圖片</button>
            </div>
          </div>
          <div className="col-sm-8">
            <div className="mb-3">
              <label htmlFor="title" className="form-label">標題</label>
              <input name="title" id="title" type="text" className="form-control" placeholder="請輸入標題" value={tempProduct.title} onChange={(e) => handleModalInputChange(e)}/>
            </div>
            <div className="row">
              <div className="mb-3 col-md-6">
                <label htmlFor="category" className="form-label">分類</label>
                <input name="category" id="category" type="text" className="form-control" placeholder="請輸入分類" value={tempProduct.category} onChange={(e) => handleModalInputChange(e)}/>
              </div>
              <div className="mb-3 col-md-6">
                <label htmlFor="unit" className="form-label">單位</label>
                <input name="unit" id="unit" type="text" className="form-control" placeholder="請輸入單位" value={tempProduct.unit} onChange={(e) => handleModalInputChange(e)}/>
              </div>
            </div>

            <div className="row">
              <div className="mb-3 col-md-6">
                <label htmlFor="origin_price" className="form-label">原價</label>
                <input name="origin_price" id="origin_price" type="number" min="0" className="form-control" placeholder="請輸入原價" value={tempProduct.origin_price} onChange={(e) => handleModalInputChange(e)}/>
              </div>
              <div className="mb-3 col-md-6">
                <label htmlFor="price" className="form-label">售價</label>
                <input name="price" id="price" type="number" min="0" className="form-control" placeholder="請輸入售價" value={tempProduct.price} onChange={(e) => handleModalInputChange(e)}/>
              </div>
            </div>
            <hr />

            <div className="mb-3">
              <label htmlFor="description" className="form-label">產品描述</label>
              <textarea name="description" id="description" className="form-control" placeholder="請輸入產品描述" value={tempProduct.description} onChange={(e) => handleModalInputChange(e)}></textarea>
            </div>
            <div className="mb-3">
              <label htmlFor="content" className="form-label">說明內容</label>
              <textarea name="content" id="content" className="form-control" placeholder="請輸入說明內容" value={tempProduct.content} onChange={(e) => handleModalInputChange(e)}></textarea>
            </div>
            <div className="mb-3">
              <div className="form-check">
                <input name="is_enabled" id="is_enabled" className="form-check-input" type="checkbox" checked={tempProduct.is_enabled} onChange={(e) => handleModalInputChange(e)}/>
                <label className="form-check-label" htmlFor="is_enabled">是否啟用</label>
              </div>
            </div>
          </div>
        </div>
              )
            }
            
            
      </div>
      <div className="modal-footer"> {
        modalType === 'delete' ? (
          <button type="button" className="btn btn-danger" onClick={() => deleteProduct(tempProduct.id)}>刪除</button>
        ) : (
          <>
          <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal" onClick={() => closeModal()}>取消</button>
          <button type="button" className="btn btn-primary" onClick={() => updateProduct(tempProduct.id)}>確認</button>
          </>
        ) }
      </div>
    </div>
  </div>
      </div>
      </div>
    </div>
    </>
  );
}

export default App;
