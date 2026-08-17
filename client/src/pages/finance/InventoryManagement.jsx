import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Package, AlertTriangle } from "lucide-react";
import { inventoryService } from "../../services/financeService";
import toast from "react-hot-toast";
import {useNavigate} from "react-router-dom"

export default function InventoryManagement() {
  const [inventory, setInventory] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    item_name: "",
    quantity: "",
    price: "",
    category: "",
    mrp: "",
    discount_price: "",
    gst_percent: "",
  });

  const navigate = useNavigate();
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invRes, valueRes] = await Promise.all([
        inventoryService.getAll(),
        inventoryService.getTotalValue(),
      ]);
      setInventory(invRes.data);
      setTotalValue(valueRes.data.total_value);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast.error("Failed to fetch inventory");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        item_name: formData.item_name,
        quantity: parseInt(formData.quantity),
        price: parseFloat(formData.price),
        category: formData.category,
        mrp: formData.mrp !== "" ? parseFloat(formData.mrp) : null,
        discount_price:
          formData.discount_price !== ""
            ? parseFloat(formData.discount_price)
            : null,
        gst_percent:
          formData.gst_percent !== "" ? parseFloat(formData.gst_percent) : null,
      };

      if (editingId) {
        await inventoryService.update(editingId, data);
        toast.success("Item updated successfully");
      } else {
        await inventoryService.add(data);
        toast.success("Item added successfully");
      }

      setShowModal(false);
      setEditingId(null);
      setFormData({ item_name: "", quantity: "", price: "", category: "" });
      fetchData();
    } catch (error) {
      console.error("Error saving item:", error);
      toast.error("Failed to save item");
    }
  };

  const handleEdit = (item) => {
    setFormData({
      item_name: item.item_name,
      quantity: item.quantity.toString(),
      price: item.price.toString(),
      category: item.category || "",
      mrp: item.mrp?.toString() || "",
      discount_price: item.discount_price?.toString() || "",
      gst_percent: item.gst_percent?.toString() || "",
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await inventoryService.delete(id);
      toast.success("Item deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Inventory Management
          </h1>
          <p className="text-gray-600 mt-1">Manage stock and inventory items</p>
        </div>
        <button
          onClick={() => navigate("/finance/services")}
          className="bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          Service Section
        </button>
        <button
          onClick={() => {
            setShowModal(true);
            setEditingId(null); 
            setFormData({
              item_name: "",
              quantity: "",
              price: "",
              category: "",
              mrp: "",
              discount_price: "",
              gst_percent: "",
            });
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Inventory Value</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                ₹{parseFloat(totalValue).toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-purple-100 rounded-lg">
              <Package className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {inventory.length}
              </p>
            </div>
            <div className="p-4 bg-blue-100 rounded-lg">
              <AlertTriangle className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Stock Items
        </h2>
        <div className="overflow-auto max-h-[60vh]">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Item Name
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Category
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Quantity
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Purchase Price
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Selling Price
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Total Value
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    No inventory items yet
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 font-medium">{item.item_name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                        {item.category || "Uncategorized"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          item.quantity < 10 ? "text-red-600" : "text-gray-900"
                        }`}
                      >
                        {item.quantity}
                        {item.quantity < 10 && (
                          <AlertTriangle className="inline w-4 h-4 ml-1 text-red-600" />
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      ₹{parseFloat(item.price).toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      <div>
                        <span className="line-through text-gray-400 mr-2">
                          ₹{item.mrp || " - "}
                        </span>
                        <span className="text-green-600 font-semibold">
                          ₹{item.discount_price || " - "}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-semibold">
                      ₹
                      {(
                        item.quantity * parseFloat(item.price)
                      ).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? "Edit Item" : "Add New Item"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.item_name}
                  onChange={(e) =>
                    setFormData({ ...formData, item_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Product name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Electronics, Furniture"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    MRP
                  </label>

                  <input
                    type="number"
                    placeholder="MRP"
                    value={formData.mrp}
                    onChange={(e) =>
                      setFormData({ ...formData, mrp: e.target.value })
                    }
                    className="input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Offer Price
                  </label>

                  <input
                    type="number"
                    placeholder="Offer Price"
                    required
                    value={formData.discount_price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_price: e.target.value,
                      })
                    }
                    className="input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GST %
                  </label>

                  <input
                    type="number"
                    placeholder="GST %"
                    value={formData.gst_percent}
                    onChange={(e) =>
                      setFormData({ ...formData, gst_percent: e.target.value })
                    }
                    className="input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingId ? "Update" : "Add"} Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
