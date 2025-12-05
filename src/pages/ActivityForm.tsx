import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
  CalendarIcon,
  ChevronRight,
  X,
  Eye,
  Pencil,
  Trash2,
  Star,
  Copy,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Activity, TimeSlot, ActivityReview } from "@/types/activity";
import { activityService } from "@/services/activityService";
import { toast } from "sonner";

const HOTSPOT_OPTIONS = [
  { value: "clay-oven-munnar", label: "Clay Oven, Munnar" },
  { value: "spice-plantation-thekkady", label: "Spice plantation, Thekkady" },
  { value: "kathakali-cochin", label: "K V Kathakali center, Cochin" },
  { value: "zipline-ooty", label: "Zip line ooty, Ooty" },
];

const TABS = [
  { id: 1, name: "Activity Basic Details" },
  { id: 2, name: "Price Book" },
  { id: 3, name: "FeedBack & Review" },
  { id: 4, name: "Preview" },
];

const getEmptyActivity = (): Omit<Activity, "id"> => ({
  title: "",
  hotspot: "",
  hotspotPlace: "",
  maxAllowedPersonCount: 0,
  duration: "00:00:00",
  description: "",
  images: [],
  defaultAvailableTimes: [{ startTime: "", endTime: "" }],
  isSpecialDay: false,
  specialDays: [],
  pricing: {
    startDate: "",
    endDate: "",
    adult: 0,
    children: 0,
    infant: 0,
    foreignAdult: 0,
    foreignChildren: 0,
    foreignInfant: 0,
  },
  reviews: [],
  status: true,
});

const ActivityForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;
  const isReadonly = searchParams.get("readonly") === "true";
  const initialTab = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState(() => {
    if (initialTab === "preview") return 4;
    if (initialTab === "feedback") return 3;
    if (initialTab === "pricebook") return 2;
    return 1;
  });

  const [formData, setFormData] = useState<Omit<Activity, "id">>(getEmptyActivity());
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Review form state
  const [reviewRating, setReviewRating] = useState("");
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewPageSize, setReviewPageSize] = useState(10);
  const [reviewPage, setReviewPage] = useState(1);

  // Price book dates
  const [priceStartDate, setPriceStartDate] = useState<Date | undefined>();
  const [priceEndDate, setPriceEndDate] = useState<Date | undefined>();

  useEffect(() => {
    if (isEdit && id) {
      loadActivity(id);
    }
  }, [id, isEdit]);

  const loadActivity = async (activityId: string) => {
    setLoading(true);
    const activity = await activityService.getActivity(activityId);
    if (activity) {
      const { id: _, ...rest } = activity;
      setFormData(rest);
      if (activity.pricing.startDate) {
        setPriceStartDate(new Date(activity.pricing.startDate));
      }
      if (activity.pricing.endDate) {
        setPriceEndDate(new Date(activity.pricing.endDate));
      }
    }
    setLoading(false);
  };

  const handleInputChange = (
    field: keyof Omit<Activity, "id">,
    value: any
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePricingChange = (field: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      pricing: { ...prev.pricing, [field]: value },
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setImageFiles((prev) => [...prev, ...newFiles]);
      newFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setImagePreviews((prev) => [...prev, ev.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const addDefaultTime = () => {
    setFormData((prev) => ({
      ...prev,
      defaultAvailableTimes: [
        ...prev.defaultAvailableTimes,
        { startTime: "", endTime: "" },
      ],
    }));
  };

  const updateDefaultTime = (
    index: number,
    field: keyof TimeSlot,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      defaultAvailableTimes: prev.defaultAvailableTimes.map((t, i) =>
        i === index ? { ...t, [field]: value } : t
      ),
    }));
  };

  const handleSaveReview = async () => {
    if (!reviewRating || !reviewFeedback) {
      toast.error("Please fill in rating and feedback");
      return;
    }
    if (isEdit && id) {
      const newReview = await activityService.addReview(id, {
        rating: Number(reviewRating),
        description: reviewFeedback,
      });
      if (newReview) {
        setFormData((prev) => ({
          ...prev,
          reviews: [...prev.reviews, newReview],
        }));
        setReviewRating("");
        setReviewFeedback("");
        toast.success("Review added successfully");
      }
    } else {
      // For new activity, add to local state
      const newReview: ActivityReview = {
        id: String(Date.now()),
        rating: Number(reviewRating),
        description: reviewFeedback,
        createdOn: new Date().toLocaleString(),
      };
      setFormData((prev) => ({
        ...prev,
        reviews: [...prev.reviews, newReview],
      }));
      setReviewRating("");
      setReviewFeedback("");
      toast.success("Review added");
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (isEdit && id) {
      await activityService.deleteReview(id, reviewId);
    }
    setFormData((prev) => ({
      ...prev,
      reviews: prev.reviews.filter((r) => r.id !== reviewId),
    }));
    toast.success("Review deleted");
  };

  const handleUpdatePricing = () => {
    setFormData((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        startDate: priceStartDate ? format(priceStartDate, "yyyy-MM-dd") : "",
        endDate: priceEndDate ? format(priceEndDate, "yyyy-MM-dd") : "",
      },
    }));
    toast.success("Pricing dates updated");
  };

  const handleSubmit = async () => {
    if (isEdit && id) {
      await activityService.updateActivity(id, formData);
      toast.success("Activity updated successfully");
    } else {
      await activityService.createActivity(formData);
      toast.success("Activity saved successfully");
    }
    navigate("/activities");
  };

  const goToNextTab = () => {
    if (activeTab < 4) setActiveTab(activeTab + 1);
  };

  const goToPrevTab = () => {
    if (activeTab > 1) setActiveTab(activeTab - 1);
  };

  const filteredReviews = formData.reviews.filter((r) =>
    r.description.toLowerCase().includes(reviewSearch.toLowerCase())
  );

  const paginatedReviews = filteredReviews.slice(
    (reviewPage - 1) * reviewPageSize,
    reviewPage * reviewPageSize
  );

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "w-4 h-4",
          i < rating ? "fill-primary text-primary" : "text-gray-300"
        )}
      />
    ));
  };

  if (loading) {
    return (
      <div className="p-6 bg-pink-50/30 min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-6 bg-pink-50/30 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          {isEdit ? `Edit Activity » ${formData.title}` : "Add Activity"}
        </h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="text-primary hover:underline">
            Dashboard
          </Link>
          <span>&gt;</span>
          <Link to="/activities" className="text-primary hover:underline">
            List of Activity
          </Link>
          <span>&gt;</span>
          <span className="text-primary">
            {isEdit ? "Edit Activity" : "Add Activity"}
          </span>
        </div>
      </div>

      {/* Card with Tabs */}
      <Card className="shadow-sm">
        {/* Tab Header */}
        <div className="border-b px-6 pt-4">
          <div className="flex items-center gap-2 flex-wrap">
            {TABS.map((tab, index) => (
              <div key={tab.id} className="flex items-center">
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-t-lg transition",
                    activeTab === tab.id
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                  disabled={isReadonly && tab.id !== 4}
                >
                  <span
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium",
                      activeTab === tab.id
                        ? "bg-white text-primary"
                        : "bg-gray-300 text-gray-600"
                    )}
                  >
                    {tab.id}
                  </span>
                  <span className="text-sm font-medium">{tab.name}</span>
                </button>
                {index < TABS.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        <CardContent className="p-6">
          {/* Tab 1: Basic Details */}
          {activeTab === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label>
                    Activity Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Enter activity title"
                    disabled={isReadonly}
                  />
                </div>
                <div>
                  <Label>
                    Hotspot Places <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.hotspot}
                    onValueChange={(v) => {
                      const opt = HOTSPOT_OPTIONS.find((o) => o.value === v);
                      handleInputChange("hotspot", opt?.label.split(",")[0] || v);
                      handleInputChange(
                        "hotspotPlace",
                        opt?.label.split(",")[1]?.trim() || ""
                      );
                    }}
                    disabled={isReadonly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select hotspot" />
                    </SelectTrigger>
                    <SelectContent>
                      {HOTSPOT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>
                    Max Allowed Person Count{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={formData.maxAllowedPersonCount}
                    onChange={(e) =>
                      handleInputChange(
                        "maxAllowedPersonCount",
                        Number(e.target.value)
                      )
                    }
                    disabled={isReadonly}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>
                    Duration <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.duration}
                    onChange={(e) =>
                      handleInputChange("duration", e.target.value)
                    }
                    placeholder="HH:MM:SS"
                    disabled={isReadonly}
                  />
                </div>
                <div>
                  <Label>
                    Upload Images <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isReadonly}
                  />
                </div>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index}`}
                        className="w-20 h-20 object-cover rounded"
                      />
                      {!isReadonly && (
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div>
                <Label>
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  rows={4}
                  disabled={isReadonly}
                />
              </div>

              {/* Default Available Time */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-primary mb-4">
                  Default Available Time
                </h3>
                {formData.defaultAvailableTimes.map((time, index) => (
                  <div key={index} className="flex items-center gap-4 mb-4">
                    <div>
                      <Label>
                        Start Time<span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="time"
                        value={time.startTime}
                        onChange={(e) =>
                          updateDefaultTime(index, "startTime", e.target.value)
                        }
                        disabled={isReadonly}
                      />
                    </div>
                    <div>
                      <Label>
                        End Time<span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="time"
                        value={time.endTime}
                        onChange={(e) =>
                          updateDefaultTime(index, "endTime", e.target.value)
                        }
                        disabled={isReadonly}
                      />
                    </div>
                  </div>
                ))}
                {!isReadonly && (
                  <Button
                    variant="outline"
                    onClick={addDefaultTime}
                    className="text-primary border-primary hover:bg-primary/10"
                  >
                    +Add Default Time
                  </Button>
                )}
              </div>

              {/* Special Available Time */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-primary mb-4">
                  Special Available Time
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.isSpecialDay}
                      onCheckedChange={(checked) =>
                        handleInputChange("isSpecialDay", checked)
                      }
                      disabled={isReadonly}
                    />
                    <Label>Special Day ?</Label>
                  </div>
                  {formData.isSpecialDay && !isReadonly && (
                    <Button
                      variant="outline"
                      className="text-primary border-primary hover:bg-primary/10"
                    >
                      + Add Days
                    </Button>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between pt-6 border-t">
                <Button
                  variant="secondary"
                  onClick={() => navigate("/activities")}
                >
                  Back
                </Button>
                {!isReadonly && (
                  <Button onClick={goToNextTab}>Update & Continue</Button>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Price Book */}
          {activeTab === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium">Activity Cost Details</h3>
                <div className="flex items-center gap-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[150px]">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {priceStartDate
                          ? format(priceStartDate, "PP")
                          : "Start Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={priceStartDate}
                        onSelect={setPriceStartDate}
                        className="pointer-events-auto"
                        disabled={isReadonly}
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[150px]">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {priceEndDate
                          ? format(priceEndDate, "PP")
                          : "End date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={priceEndDate}
                        onSelect={setPriceEndDate}
                        className="pointer-events-auto"
                        disabled={isReadonly}
                      />
                    </PopoverContent>
                  </Popover>
                  {!isReadonly && (
                    <Button onClick={handleUpdatePricing}>Update</Button>
                  )}
                </div>
              </div>

              {/* Indian Pricing */}
              <div className="grid grid-cols-4 gap-6 items-end">
                <div>
                  <Label className="text-gray-500">Nationality</Label>
                  <p className="text-primary font-medium">Indian</p>
                </div>
                <div>
                  <Label className="text-primary">Adult</Label>
                  <Input
                    type="number"
                    placeholder="Enter Price"
                    value={formData.pricing.adult || ""}
                    onChange={(e) =>
                      handlePricingChange("adult", Number(e.target.value))
                    }
                    disabled={isReadonly}
                  />
                </div>
                <div>
                  <Label className="text-primary">Children</Label>
                  <Input
                    type="number"
                    placeholder="Enter Price"
                    value={formData.pricing.children || ""}
                    onChange={(e) =>
                      handlePricingChange("children", Number(e.target.value))
                    }
                    disabled={isReadonly}
                  />
                </div>
                <div>
                  <Label className="text-primary">Infant</Label>
                  <Input
                    type="number"
                    placeholder="Enter Price"
                    value={formData.pricing.infant || ""}
                    onChange={(e) =>
                      handlePricingChange("infant", Number(e.target.value))
                    }
                    disabled={isReadonly}
                  />
                </div>
              </div>

              {/* Non-Indian Pricing */}
              <div className="grid grid-cols-4 gap-6 items-end">
                <div>
                  <Label className="text-gray-500">Nationality</Label>
                  <p className="text-primary font-medium">Non-Indian</p>
                </div>
                <div>
                  <Label className="text-primary">Foreign Adult</Label>
                  <Input
                    type="number"
                    placeholder="Enter Price"
                    value={formData.pricing.foreignAdult || ""}
                    onChange={(e) =>
                      handlePricingChange("foreignAdult", Number(e.target.value))
                    }
                    disabled={isReadonly}
                  />
                </div>
                <div>
                  <Label className="text-primary">Foreign Children</Label>
                  <Input
                    type="number"
                    placeholder="Enter Price"
                    value={formData.pricing.foreignChildren || ""}
                    onChange={(e) =>
                      handlePricingChange(
                        "foreignChildren",
                        Number(e.target.value)
                      )
                    }
                    disabled={isReadonly}
                  />
                </div>
                <div>
                  <Label className="text-primary">Foreign Infant</Label>
                  <Input
                    type="number"
                    placeholder="Enter Price"
                    value={formData.pricing.foreignInfant || ""}
                    onChange={(e) =>
                      handlePricingChange(
                        "foreignInfant",
                        Number(e.target.value)
                      )
                    }
                    disabled={isReadonly}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between pt-6 border-t">
                <Button variant="secondary" onClick={goToPrevTab}>
                  Back
                </Button>
                {!isReadonly && (
                  <Button onClick={goToNextTab}>Update & Continue</Button>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Feedback & Review */}
          {activeTab === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Add Review Form */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium text-primary mb-4">
                    Rating
                  </h3>
                  <Select
                    value={reviewRating}
                    onValueChange={setReviewRating}
                    disabled={isReadonly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Star</SelectItem>
                      <SelectItem value="2">2 Stars</SelectItem>
                      <SelectItem value="3">3 Stars</SelectItem>
                      <SelectItem value="4">4 Stars</SelectItem>
                      <SelectItem value="5">5 Stars</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-2 mb-4">
                    All reviews are from genuine customers
                  </p>
                  <Label>
                    Feedback <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={reviewFeedback}
                    onChange={(e) => setReviewFeedback(e.target.value)}
                    rows={4}
                    className="mt-2"
                    disabled={isReadonly}
                  />
                  {!isReadonly && (
                    <Button onClick={handleSaveReview} className="mt-4">
                      Save
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Right: Reviews List */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium mb-4">List of Reviews</h3>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Show</span>
                      <Select
                        value={String(reviewPageSize)}
                        onValueChange={(v) => setReviewPageSize(Number(v))}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm">entries</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Search:</span>
                      <Input
                        value={reviewSearch}
                        onChange={(e) => setReviewSearch(e.target.value)}
                        className="w-32"
                      />
                      <Button variant="outline" size="sm">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <FileText className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>S.NO</TableHead>
                        <TableHead>RATING</TableHead>
                        <TableHead>DESCRIPTION</TableHead>
                        <TableHead>CREATED ON</TableHead>
                        <TableHead>ACTION</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedReviews.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-4 text-gray-500"
                          >
                            No data available in table
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedReviews.map((review, index) => (
                          <TableRow key={review.id}>
                            <TableCell>
                              {(reviewPage - 1) * reviewPageSize + index + 1}
                            </TableCell>
                            <TableCell>
                              <div className="flex">
                                {renderStars(review.rating)}
                              </div>
                            </TableCell>
                            <TableCell>{review.description}</TableCell>
                            <TableCell>{review.createdOn}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-yellow-600"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600"
                                  onClick={() => deleteReview(review.id)}
                                  disabled={isReadonly}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-gray-500">
                      Showing {paginatedReviews.length > 0 ? 1 : 0} to{" "}
                      {paginatedReviews.length} of {filteredReviews.length}{" "}
                      entries
                    </span>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">
                        Previous
                      </Button>
                      <Button variant="outline" size="sm">
                        Next
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Buttons */}
              <div className="col-span-full flex items-center justify-between pt-6 border-t">
                <Button variant="secondary" onClick={goToPrevTab}>
                  Back
                </Button>
                {!isReadonly && (
                  <Button onClick={goToNextTab}>Update & Continue</Button>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Preview */}
          {activeTab === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-medium">Preview</h2>

              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-medium text-primary mb-4">
                  Basic Info
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-gray-500">Activity Title</Label>
                    <p className="font-medium">{formData.title || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Hotspot Places</Label>
                    <p className="font-medium">{formData.hotspot || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">
                      Max Allowed Person Count
                    </Label>
                    <p className="font-medium">
                      {formData.maxAllowedPersonCount}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Duration</Label>
                    <p className="font-medium">{formData.duration}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Label className="text-gray-500">Description</Label>
                  <p className="font-medium">{formData.description || "-"}</p>
                </div>
              </div>

              {/* Images */}
              {imagePreviews.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-primary mb-4">
                    Images
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {imagePreviews.map((preview, index) => (
                      <img
                        key={index}
                        src={preview}
                        alt={`Preview ${index}`}
                        className="w-20 h-20 object-cover rounded"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Default Available Time */}
              <div>
                <h3 className="text-lg font-medium text-primary mb-4">
                  Default Available Time
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-pink-100">
                      <TableHead>S.NO</TableHead>
                      <TableHead>START TIME</TableHead>
                      <TableHead>END TIME</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.defaultAvailableTimes.map((time, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{time.startTime || "-"}</TableCell>
                        <TableCell>{time.endTime || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Special Day */}
              <div>
                <h3 className="text-lg font-medium text-primary mb-4">
                  Special Day
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-pink-100">
                      <TableHead>S.NO</TableHead>
                      <TableHead>DATE</TableHead>
                      <TableHead>START TIME</TableHead>
                      <TableHead>END TIME</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.specialDays.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-gray-500"
                        >
                          No Special Time Found !!!
                        </TableCell>
                      </TableRow>
                    ) : (
                      formData.specialDays.map((day, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{day.date}</TableCell>
                          <TableCell>
                            {day.timeSlots[0]?.startTime || "-"}
                          </TableCell>
                          <TableCell>
                            {day.timeSlots[0]?.endTime || "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Reviews */}
              <div>
                <h3 className="text-lg font-medium text-primary mb-4">Review</h3>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-pink-100">
                      <TableHead>S.NO</TableHead>
                      <TableHead>RATING</TableHead>
                      <TableHead>DESCRIPTION</TableHead>
                      <TableHead>CREATED ON</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.reviews.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-gray-500"
                        >
                          No reviews yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      formData.reviews.map((review, index) => (
                        <TableRow key={review.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{review.rating} STARS</TableCell>
                          <TableCell>{review.description}</TableCell>
                          <TableCell>{review.createdOn}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between pt-6 border-t">
                <Button variant="secondary" onClick={goToPrevTab}>
                  Back
                </Button>
                <Button onClick={handleSubmit}>
                  {isEdit ? "Submit" : "Submit"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityForm;
