export const successResponse = (data, meta = null) => {
  const response = {
    status: true,
    content: {},
  };

  if (meta) {
    response.content.meta = meta;
  }

  if (data) {
    response.content.data = data;
  }

  return response;
};

export const errorResponse = (message, code = "INTERNAL_SERVER_ERROR") => {
  return {
    status: false,
    content: {
      error: {
        code,
        message,
      },
    },
  };
};
