import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";

export function useUserId() {
  const [id, setId] = useState<string>("");

  useEffect(() => {
    let stored = localStorage.getItem("userId");
    if (!stored) {
      stored = uuid();
      localStorage.setItem("userId", stored);
    }
    setId(stored);
  }, []);

  return id;
}
