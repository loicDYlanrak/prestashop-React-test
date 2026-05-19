import { useEffect, useState } from "react";

export function useFetch(url, options = {}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [errors, setErrors] = useState(null);

  useEffect(() => {
    fetch(url, {
      ...options,
      cache: "force-cache",
      headers: {
        ...(options.headers || {}),
      },
    })
      .then((r) => r.text())
      .then((data) => {
        setData(data);
      })
      .catch((e) => {
        setErrors(e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [url, options]);
  return {
    loading,
    data,
    errors,
  };
}
