import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Building2, CheckCircle, XCircle } from "lucide-react";
import { assetService } from "../../services/financeService";
import toast from "react-hot-toast";

export default function AssetManagement() {
  const [assets, setAssets] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    asset_name: "",
    asset_type: "",
    status: "active",
    purchase_date: new Date().toISOString().split("T")[0],
    purchase_value: "",
    description: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const mapStatus = (status) => {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "inactive":
      return "MAINTENANCE";
    case "disposed":
      return "SOLD";
    default:
      return "ACTIVE";
  }
};

const reverseStatus = (status) => {
  switch (status) {
    case "ACTIVE":
      return "active";
    case "MAINTENANCE":
      return "inactive";
    case "SOLD":
      return "disposed";
    default:
      return "active";
  }
};

  const fetchData = async () => {
    try {
      const [assetsRes, valueRes] = await Promise.all([
        assetService.getAll(),
        assetService.getTotalValue(),
      ]);
      setAssets(assetsRes.data);
      setTotalValue(valueRes.data.total_value);
    } catch (error) {
      console.error("Error fetching assets:", error);
      toast.error("Failed to fetch assets");
    } finally {
      setLoading(false);
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    // ✅ prevent NaN
    const parsedValue = parseFloat(formData.purchase_value);

    if (isNaN(parsedValue)) {
      return toast.error("Enter valid value");
    }

    // ✅ map frontend → backend
    const data = {
      asset_name: formData.asset_name,
      category: formData.asset_type,
      value: parsedValue,
      purchase_date: formData.purchase_date,
      status: mapStatus(formData.status),
      description: formData.description,
    };

    if (editingId) {
      await assetService.update(editingId, data);
      toast.success("Asset updated successfully");
    } else {
      await assetService.add(data);
      toast.success("Asset added successfully");
    }

    setShowModal(false);
    setEditingId(null);

    setFormData({
      asset_name: "",
      asset_type: "",
      status: "active",
      purchase_date: new Date().toISOString().split("T")[0],
      purchase_value: "",
      description: "",
    });

    fetchData();
  } catch (error) {
    console.error("Error saving asset:", error);
    toast.error("Failed to save asset");
  }
};

const handleEdit = (asset) => {
  setFormData({
    asset_name: asset.asset_name,
    asset_type: asset.category || "",
    status: reverseStatus(asset.status),
    purchase_date: asset.purchase_date
      ? asset.purchase_date.split("T")[0]
      : "",
    purchase_value: asset.value?.toString() || "",
    description: asset.description || "",
  });

  setEditingId(asset.id);
  setShowModal(true);
};

  const handleStatusChange = async (id, newStatus) => {
    try {
      await assetService.updateStatus(id, newStatus);
      toast.success("Asset status updated");
      fetchData();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this asset?")) return;
    try {
      await assetService.delete(id);
      toast.success("Asset deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Error deleting asset:", error);
      toast.error("Failed to delete asset");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "inactive":
        return "bg-yellow-100 text-yellow-700";
      case "disposed":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
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
          <h1 className="text-3xl font-bold text-gray-900">Asset Management</h1>
          <p className="text-gray-600 mt-1">Track and manage company assets</p>
        </div>
        <button
          onClick={() => {
            setShowModal(true);
            setEditingId(null);
            setFormData({
              asset_name: "",
              asset_type: "",
              status: "active",
              purchase_date: new Date().toISOString().split("T")[0],
              purchase_value: "",
              description: "",
            });
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Asset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Asset Value</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                ₹{parseFloat(totalValue).toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-purple-100 rounded-lg">
              <Building2 className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Assets</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{assets.length}</p>
            </div>
            <div className="p-4 bg-blue-100 rounded-lg">
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">All Assets</h2>
        <div className="overflow-auto max-h-[60vh]">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Asset Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Purchase Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Value</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    No assets recorded yet
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{asset.asset_name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                        {asset.category || "N/A"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-sm ${getStatusColor(asset.status)}`}>
                        {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {new Date(asset.purchase_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      ₹{parseFloat(asset.value).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(asset)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
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
              {editingId ? "Edit Asset" : "Add New Asset"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name</label>
                <input
                  type="text"
                  required
                  value={formData.asset_name}
                  onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Office Laptop"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <input
                  type="text"
                  value={formData.asset_type}
                  onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Electronics, Furniture"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="disposed">Disposed</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                  <input
                    type="date"
                    required
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value (₹)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.purchase_value}
                    onChange={(e) => setFormData({ ...formData, purchase_value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editingId ? "Update" : "Add"} Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
