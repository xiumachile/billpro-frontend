export const useToast = () => {
  const toast = ({ title, description }) => {
    alert(`${title}\n${description}`);
  };
  return { toast };
};

