import { useNavigate } from 'react-router-dom';

export const usePageNavigation = () => {
  const navigate = useNavigate();

  const goToChoice = () => navigate('/choice');
  const goToMovies = () => navigate('/movies');
  const goToMusic = () => navigate('/music');
  const goToUpload = () => navigate('/upload');
  const goToAdmin = () => navigate('/admin');
  const goToSearch = () => navigate('/search');
  const goToPersonalization = () => navigate('/personalization');
  const goToAuth = () => navigate('/');

  return {
    goToChoice,
    goToMovies,
    goToMusic,
    goToUpload,
    goToAdmin,
    goToSearch,
    goToPersonalization,
    goToAuth,
    navigate
  };
};
