import { Tooltip as MyTooltip } from "react-tooltip";
import Icon from "./Icon";

const Tooltip = ({ className, title }) => (
    <div
        className={`inline-flex group ml-2 cursor-pointer ${className || ""}`}
        data-tooltip-id="my-tooltip"
        data-tooltip-content={title}
    >
        <Icon
            className="!w-5 !h-5 fill-theme-secondary opacity-50 transition-all group-hover:opacity-100 dark:opacity-100 dark:group-hover:fill-theme-white-fixed"
            name="info"
        />
        <MyTooltip id="my-tooltip" />
    </div>
);

export default Tooltip;
