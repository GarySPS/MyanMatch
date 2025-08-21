import Icon from "./Icon"; 

const ButtonBack = ({ className = "", title = "Back", onClick }) => (
    <button
        className={`group inline-flex items-center h-14 mb-6 text-lg md:h-10 md:text-base ${className}`}
        onClick={onClick}
        type="button"
    >
        <div className="flex justify-center items-center w-10 h-10 mr-3">
            <Icon
                className="fill-theme-secondary transition-transform group-hover:-translate-x-0.5"
                name="arrow-left"
            />
        </div>
        {title}
    </button>
);

export default ButtonBack;
