import { baseApi } from "../baseApi";

const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdmins: builder.query({
      query: () => "/admin/admins",
      providesTags: ["Admin"],
    }),
    addAdmin: builder.mutation({
      query: (admin) => ({
        url: "/admin/admins",
        method: "POST",
        body: admin,
      }),
      invalidatesTags: ["Admin"],
    }),
    updateAdmin: builder.mutation({
      query: ({ id, ...admin }) => ({
        url: `/admins/${id}`,
        method: "PUT",
        body: admin,
      }),
      invalidatesTags: ["Admin"],
    }),
    deleteAdmin: builder.mutation({
      query: (id) => ({
        url: `/admin/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Admin"],
    }),
     blockAdmin: builder.mutation({
      query: (id) => ({
        url: `/admins/block/${id}`,
        method: "PUT",
      }),
      invalidatesTags: ["Admin"],
    }),
  }),
});

export const {
  useGetAdminsQuery,
  useAddAdminMutation,
  useUpdateAdminMutation,
  useDeleteAdminMutation,
  useBlockAdminMutation,
} = adminApi;
