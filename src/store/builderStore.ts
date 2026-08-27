import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateId } from "@/lib/id";
import { generateWorkOrder } from "@/lib/workOrder";
import type {
  AnnotationItem,
  ApprovalStatus,
  BuilderOptions,
  DesignJson,
  DesignState,
  MockupOffset,
  MockupOffsetState,
  ViewSide,
  WorkOrderData,
} from "@/types/builder";
import { DEFAULT_MOCKUP_OFFSET, getDesignViewSides, normalizeBuilderOptions } from "@/types/builder";
import type { SavedBuilderPayload } from "@/types/saved-design";

const defaultOptions = normalizeBuilderOptions({ quantity: 50 });

const emptyDesign: DesignState = {};

function createOrderNo() {
  return `JH-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
}

export type PendingPin = {
  side: ViewSide;
  x: number;
  y: number;
};

type BuilderStore = {
  orderNo: string;
  options: BuilderOptions;
  currentSide: ViewSide;
  designData: DesignState;
  annotations: AnnotationItem[];
  annotationMode: boolean;
  mockupOffsets: MockupOffsetState;
  activeAnnotationId: string | null;
  pendingPin: PendingPin | null;
  editingAnnotationId: string | null;
  approvalStatus: ApprovalStatus;
  outOfBoundsWarning: boolean;
  workOrderPreview: WorkOrderData | null;
  showJsonModal: boolean;
  showWorkOrderModal: boolean;
  savedDesignId: string | null;
  savedDesignTitle: string;
  loadedOrderId: string | null;
  loadedOrderNumber: string;
  loadedOrderNotes: string;
  loadedShippingName: string;
  loadedShippingPhone: string;
  loadedShippingZip: string;
  loadedShippingAddress: string;

  setOption: <K extends keyof BuilderOptions>(
    key: K,
    value: BuilderOptions[K],
  ) => void;
  setCurrentSide: (side: ViewSide) => void;
  saveCurrentDesign: (side: ViewSide, json: DesignJson) => void;
  setAnnotationMode: (value: boolean) => void;
  setMockupOffset: (side: ViewSide, offset: MockupOffset) => void;
  nudgeAnnotationsOnSide: (side: ViewSide, dxNorm: number, dyNorm: number) => void;
  setPendingPin: (pin: PendingPin | null) => void;
  setActiveAnnotationId: (id: string | null) => void;
  setEditingAnnotationId: (id: string | null) => void;
  addAnnotation: (data: {
    side: ViewSide;
    x: number;
    y: number;
    title: string;
    message: string;
    author?: string;
  }) => void;
  updateAnnotation: (
    id: string,
    data: Partial<Pick<AnnotationItem, "title" | "message" | "status">>,
  ) => void;
  deleteAnnotation: (id: string) => void;
  setApprovalStatus: (status: ApprovalStatus) => void;
  setOutOfBoundsWarning: (value: boolean) => void;
  setShowJsonModal: (value: boolean) => void;
  setShowWorkOrderModal: (value: boolean) => void;
  resetBuilder: () => void;
  startNewOrder: () => void;
  resetForNewProduct: (
    productType: BuilderOptions["productType"],
    overrides?: Partial<BuilderOptions>,
  ) => void;
  loadSavedPayload: (
    payload: SavedBuilderPayload,
    meta?: {
      id?: string | null;
      title?: string;
      orderId?: string | null;
      orderNumber?: string;
      notes?: string;
      shippingName?: string;
      shippingPhone?: string;
      shippingZip?: string;
      shippingAddress?: string;
    },
  ) => void;
  setSavedDesignMeta: (id: string | null, title?: string) => void;
  setOrderLink: (data: {
    designId: string | null;
    orderId: string;
    orderNumber: string;
    title?: string;
    notes?: string;
    shippingName?: string;
    shippingPhone?: string;
    shippingZip?: string;
    shippingAddress?: string;
  }) => void;
  generateWorkOrderPreview: () => WorkOrderData | null;
};

function nextAnnotationNumber(items: AnnotationItem[]) {
  if (!items.length) return 1;
  return Math.max(...items.map((a) => a.number)) + 1;
}

export const useBuilderStore = create<BuilderStore>()(
  persist(
    (set, get) => ({
      orderNo: createOrderNo(),
      options: defaultOptions,
      currentSide: "front",
      designData: { ...emptyDesign },
      annotations: [],
      annotationMode: false,
      mockupOffsets: { ...DEFAULT_MOCKUP_OFFSET },
      activeAnnotationId: null,
      pendingPin: null,
      editingAnnotationId: null,
      approvalStatus: "DRAFT",
      outOfBoundsWarning: false,
      workOrderPreview: null,
      showJsonModal: false,
      showWorkOrderModal: false,
      savedDesignId: null,
      savedDesignTitle: "",
      loadedOrderId: null,
      loadedOrderNumber: "",
      loadedOrderNotes: "",
      loadedShippingName: "",
      loadedShippingPhone: "",
      loadedShippingZip: "",
      loadedShippingAddress: "",

      setOption: (key, value) => {
        set((state) => {
          const options = normalizeBuilderOptions({ ...state.options, [key]: value });
          let currentSide = state.currentSide;
          const enabled = getDesignViewSides(options.productType, options.printSide);
          const isClassic = currentSide === "front" || currentSide === "back" || currentSide === "side";
          if (isClassic && !enabled.includes(currentSide)) {
            currentSide = enabled[0] ?? "front";
          }
          return { options, currentSide, approvalStatus: "DRAFT" as const };
        });
      },

      setCurrentSide: (side) =>
        set({ currentSide: side, activeAnnotationId: null }),

      saveCurrentDesign: (side, json) =>
        set((state) => ({
          designData: { ...state.designData, [side]: json },
          approvalStatus: "DRAFT" as const,
        })),

      setAnnotationMode: (value) =>
        set({
          annotationMode: value,
          activeAnnotationId: null,
          pendingPin: null,
          editingAnnotationId: null,
        }),

      setMockupOffset: (side, offset) => {
        set((state) => ({
          mockupOffsets: {
            ...state.mockupOffsets,
            [side]: offset,
          },
        }));
      },

      nudgeAnnotationsOnSide: (side, dxNorm, dyNorm) => {
        if (dxNorm === 0 && dyNorm === 0) return;
        set((state) => ({
          annotations: state.annotations.map((a) =>
            a.side === side
              ? { ...a, x: a.x + dxNorm, y: a.y + dyNorm }
              : a,
          ),
        }));
      },

      setPendingPin: (pin) => set({ pendingPin: pin }),

      setActiveAnnotationId: (id) => set({ activeAnnotationId: id }),

      setEditingAnnotationId: (id) => set({ editingAnnotationId: id }),

      addAnnotation: (data) => {
        const title = data.title.trim();
        const message = data.message.trim();
        if (!title || !message) return;

        const item: AnnotationItem = {
          id: generateId(),
          number: nextAnnotationNumber(get().annotations),
          side: data.side,
          x: data.x,
          y: data.y,
          title,
          message,
          author: data.author?.trim() || "클라이언트",
          createdAt: new Date().toISOString(),
          status: "open",
        };

        set((state) => ({
          annotations: [item, ...state.annotations],
          pendingPin: null,
          editingAnnotationId: null,
          activeAnnotationId: item.id,
          annotationMode: false,
          approvalStatus: "REVISION_REQUESTED" as const,
        }));
      },

      updateAnnotation: (id, data) => {
        set((state) => ({
          annotations: state.annotations.map((a) =>
            a.id === id ? { ...a, ...data } : a,
          ),
          pendingPin: null,
          editingAnnotationId: null,
        }));
      },

      deleteAnnotation: (id) =>
        set((state) => ({
          annotations: state.annotations.filter((a) => a.id !== id),
          activeAnnotationId:
            state.activeAnnotationId === id ? null : state.activeAnnotationId,
          editingAnnotationId:
            state.editingAnnotationId === id ? null : state.editingAnnotationId,
        })),

      setApprovalStatus: (status) => set({ approvalStatus: status }),

      setOutOfBoundsWarning: (value) => set({ outOfBoundsWarning: value }),

      setShowJsonModal: (value) => set({ showJsonModal: value }),

      setShowWorkOrderModal: (value) => set({ showWorkOrderModal: value }),

      resetBuilder: () =>
        set({
          orderNo: createOrderNo(),
          options: { ...defaultOptions },
          currentSide: "front",
          designData: { ...emptyDesign },
          annotations: [],
          annotationMode: false,
          mockupOffsets: { ...DEFAULT_MOCKUP_OFFSET },
          activeAnnotationId: null,
          pendingPin: null,
          editingAnnotationId: null,
          approvalStatus: "DRAFT",
          outOfBoundsWarning: false,
          workOrderPreview: null,
          showJsonModal: false,
          showWorkOrderModal: false,
          savedDesignId: null,
          savedDesignTitle: "",
          loadedOrderId: null,
          loadedOrderNumber: "",
          loadedOrderNotes: "",
          loadedShippingName: "",
          loadedShippingPhone: "",
          loadedShippingZip: "",
          loadedShippingAddress: "",
        }),

      startNewOrder: () => {
        get().resetBuilder();
      },

      resetForNewProduct: (productType, overrides) => {
        const options = normalizeBuilderOptions({
          ...defaultOptions,
          productType,
          ...overrides,
        });

        const enabled = getDesignViewSides(options.productType, options.printSide);
        const currentSide = enabled[0] ?? "front";

        set({
          orderNo: createOrderNo(),
          options,
          currentSide,
          designData: { ...emptyDesign },
          annotations: [],
          annotationMode: false,
          mockupOffsets: { ...DEFAULT_MOCKUP_OFFSET },
          activeAnnotationId: null,
          pendingPin: null,
          editingAnnotationId: null,
          approvalStatus: "DRAFT",
          outOfBoundsWarning: false,
          workOrderPreview: null,
          showJsonModal: false,
          showWorkOrderModal: false,
          savedDesignId: null,
          savedDesignTitle: "",
          loadedOrderId: null,
          loadedOrderNumber: "",
          loadedOrderNotes: "",
          loadedShippingName: "",
          loadedShippingPhone: "",
          loadedShippingZip: "",
          loadedShippingAddress: "",
        });
      },

      loadSavedPayload: (payload, meta) => {
        const enabled = getDesignViewSides(
          payload.options.productType,
          payload.options.printSide,
        );
        let currentSide = payload.currentSide;
        if (!enabled.includes(currentSide)) {
          currentSide = enabled[0] ?? "front";
        }

        set({
          orderNo: payload.orderNo,
          options: normalizeBuilderOptions(payload.options),
          currentSide,
          designData: payload.designData,
          annotations: payload.annotations,
          mockupOffsets: payload.mockupOffsets ?? { ...DEFAULT_MOCKUP_OFFSET },
          approvalStatus: payload.approvalStatus,
          savedDesignId: meta?.id ?? null,
          savedDesignTitle: meta?.title ?? "",
          loadedOrderId: meta?.orderId ?? null,
          loadedOrderNumber: meta?.orderNumber ?? "",
          loadedOrderNotes: meta?.notes ?? "",
          loadedShippingName: meta?.shippingName ?? "",
          loadedShippingPhone: meta?.shippingPhone ?? "",
          loadedShippingZip: meta?.shippingZip ?? "",
          loadedShippingAddress: meta?.shippingAddress ?? "",
          annotationMode: false,
          activeAnnotationId: null,
          pendingPin: null,
          editingAnnotationId: null,
        });
      },

      setSavedDesignMeta: (id, title) =>
        set({
          savedDesignId: id,
          savedDesignTitle: title ?? get().savedDesignTitle,
        }),

      setOrderLink: ({
        designId,
        orderId,
        orderNumber,
        title,
        notes,
        shippingName,
        shippingPhone,
        shippingZip,
        shippingAddress,
      }) =>
        set({
          savedDesignId: designId,
          savedDesignTitle: title ?? get().savedDesignTitle,
          loadedOrderId: orderId,
          loadedOrderNumber: orderNumber,
          loadedOrderNotes: notes ?? get().loadedOrderNotes,
          loadedShippingName: shippingName ?? get().loadedShippingName,
          loadedShippingPhone: shippingPhone ?? get().loadedShippingPhone,
          loadedShippingZip: shippingZip ?? get().loadedShippingZip,
          loadedShippingAddress:
            shippingAddress ?? get().loadedShippingAddress,
        }),

      generateWorkOrderPreview: () => {
        const state = get();
        if (state.approvalStatus !== "APPROVED") return null;
        const preview = generateWorkOrder(
          state.orderNo,
          state.options,
          state.designData,
        );
        set({ workOrderPreview: preview, showWorkOrderModal: true });
        return preview;
      },
    }),
    {
      name: "jh-builder-mvp",
      version: 6,
      migrate: (persisted, version) => {
        const state = persisted as Record<string, unknown>;
        if (version < 2) {
          state.currentSide = "front";
        }
        if (version < 3) {
          state.mockupOffsets = { ...DEFAULT_MOCKUP_OFFSET };
        }
        if (version < 4) {
          state.savedDesignId = null;
          state.savedDesignTitle = "";
        }
        if (version < 5) {
          state.loadedOrderId = null;
          state.loadedOrderNumber = "";
          state.loadedOrderNotes = "";
        }
        if (version < 6 && state.options && typeof state.options === "object") {
          state.options = normalizeBuilderOptions(
            state.options as Partial<BuilderOptions>,
          );
        }
        return state;
      },
      merge: (persisted, current) => {
        const saved = persisted as Partial<BuilderStore> | undefined;
        const options = normalizeBuilderOptions(saved?.options);

        const enabled = getDesignViewSides(options.productType, options.printSide);
        let currentSide = saved?.currentSide ?? "front";
        if (!enabled.includes(currentSide)) {
          currentSide = enabled[0] ?? "front";
        }

        return {
          ...current,
          ...saved,
          options,
          currentSide,
          mockupOffsets: {
            ...DEFAULT_MOCKUP_OFFSET,
            ...saved?.mockupOffsets,
          },
        };
      },
      partialize: (state) => ({
        orderNo: state.orderNo,
        options: state.options,
        currentSide: state.currentSide,
        designData: state.designData,
        annotations: state.annotations,
        mockupOffsets: state.mockupOffsets,
        approvalStatus: state.approvalStatus,
        savedDesignId: state.savedDesignId,
        savedDesignTitle: state.savedDesignTitle,
        loadedOrderId: state.loadedOrderId,
        loadedOrderNumber: state.loadedOrderNumber,
        loadedOrderNotes: state.loadedOrderNotes,
      }),
    },
  ),
);
